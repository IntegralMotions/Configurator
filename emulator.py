#!/usr/bin/env python3
import os, sys, time, signal, subprocess, logging, logging.handlers, argparse
import serial

def hexdump(b: bytes, maxlen=64):
    s = b[:maxlen].hex(" "); return s + (" …" if len(b) > maxlen else "")

def make_logger(level, log_file=None):
    fmt = logging.Formatter("%(asctime)s | %(levelname).1s | %(name)s | %(message)s", "%Y-%m-%d %H:%M:%S")
    log = logging.getLogger("emu"); log.setLevel(level)
    sh = logging.StreamHandler(); sh.setFormatter(fmt); log.addHandler(sh)
    if log_file:
        fh = logging.handlers.RotatingFileHandler(log_file, maxBytes=2_000_000, backupCount=3); fh.setFormatter(fmt); log.addHandler(fh)
    return log

def spawn_socat(A,B,log):
    for p in (A,B):
        try:
            if os.path.islink(p): os.unlink(p)
            elif os.path.exists(p): os.remove(p)
        except Exception as e: log.warning(f"unlink {p}: {e}")
    proc = subprocess.Popen(
        ["socat","-d","-d", f"pty,raw,echo=0,link={A},perm=0666", f"pty,raw,echo=0,link={B},perm=0666"],
        stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    # stream socat diagnostics
    def _pipe(stream, tag):
        for line in iter(stream.readline, ""): log.debug(f"socat[{tag}] {line.strip()}")
    import threading
    threading.Thread(target=_pipe, args=(proc.stdout,"out"), daemon=True).start()
    threading.Thread(target=_pipe, args=(proc.stderr,"err"), daemon=True).start()
    log.info(f"socat pid={proc.pid} -> {A} <-> {B}")
    return proc

def open_serial_retry(path, baud, log, timeout=15.0):
    t0 = time.time()
    last_err = None
    while time.time()-t0 < timeout:
        try:
            ser = serial.Serial(path, baudrate=baud, timeout=0, rtscts=False, dsrdtr=False, xonxoff=False)
            log.info(f"OPEN path={path} baud={baud} is_open={ser.is_open}")
            return ser
        except Exception as e:
            last_err = e
            time.sleep(0.1)
    raise last_err or OSError("open retry timed out")

def run_loop(ser, log, tx_period, echo, hexview, stats_period):
    n_tx = n_rx = 0; buf = b""; t0 = time.monotonic(); last_stats = time.monotonic()
    while True:
        now = time.monotonic()
        if now - t0 >= tx_period:
            t0 += tx_period
            line = f"T={int(time.time()*1000)} COUNT={n_tx}\n".encode()
            ser.write(line); n_tx += 1
            log.info(f"TX {line.decode().strip()} bytes={len(line)}" + (f" hex={hexdump(line)}" if hexview else ""))
        data = ser.read(65536)
        if data:
            n_rx += len(data); buf += data
            if hexview: log.debug(f"RX bytes={len(data)} hex={hexdump(data)}")
            while b"\n" in buf:
                line, buf = buf.split(b"\n",1)
                s = line.decode(errors="ignore"); log.info(f"RX {s!r}")
                if echo:
                    out = (s+"\n").encode(); ser.write(out)
                    if hexview: log.debug(f"ECHO hex={hexdump(out)}")
        if now - last_stats >= stats_period:
            last_stats = now; log.warning(f"STATS tx_lines={n_tx} rx_bytes={n_rx} pending_buf={len(buf)}")
        time.sleep(0.005)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--baud", type=int, default=int(os.getenv("BAUD","115200")))
    ap.add_argument("--tx-period", type=float, default=1.0)
    ap.add_argument("--no-echo", action="store_true")
    ap.add_argument("--hex", action="store_true")
    ap.add_argument("--stats", type=float, default=10.0)
    ap.add_argument("--log-file", default=os.getenv("EMU_LOG","emulator.log"))
    ap.add_argument("--level", default=os.getenv("EMU_LEVEL","INFO"), choices=["DEBUG","INFO","WARNING","ERROR"])
    ap.add_argument("--port", help="Windows: COMxx | POSIX: /dev/tty* | else auto-create")
    ap.add_argument("--pty-a", default=os.getenv("PTY_A","/tmp/vserial.A"))
    ap.add_argument("--pty-b", default=os.getenv("PTY_B","/tmp/vserial.B"))
    args = ap.parse_args()

    log = make_logger(getattr(logging, args.level), args.log_file)
    log.info("START emulator")
    ser = None; soc = None

    def cleanup(*_):
        try:
            if ser and ser.is_open: log.info("CLOSE serial"); ser.close()
        except: pass
        try:
            if soc: log.info(f"TERM socat pid={soc.pid}"); soc.terminate()
        except: pass
        log.info("EXIT"); sys.exit(0)

    signal.signal(signal.SIGINT, cleanup); signal.signal(signal.SIGTERM, cleanup)

    try:
        if sys.platform.startswith("win"):
            port = args.port or os.getenv("COM_EMU","COM11")
            log.info(f"WIN mode port={port} (use com0com)")
            ser = open_serial_retry(port, args.baud, log, timeout=10)
        else:
            if args.port:
                log.info(f"POSIX manual port={args.port}")
                ser = open_serial_retry(args.port, args.baud, log)
            else:
                soc = spawn_socat(args.pty_a, args.pty_b, log)
                # wait until symlinks are created (use lexists to include dangling links)
                t0 = time.time()
                while time.time()-t0 < 15:
                    if os.path.lexists(args.pty_a) and os.path.lexists(args.pty_b): break
                    time.sleep(0.05)
                log.info(f"PAIR appSide={args.pty_a} emuSide={args.pty_b}")
                ser = open_serial_retry(args.pty_b, args.baud, log, timeout=15)
        run_loop(ser, log, args.tx_period, not args.no_echo, args.hex, args.stats)
    except serial.SerialException as e:
        log.error(f"SERIAL ERR: {e}"); cleanup()
    except Exception as e:
        log.exception(f"FATAL: {e}"); cleanup()

if __name__ == "__main__":
    main()
