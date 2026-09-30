export default {
    banner: "Product currently in development! Register to the mailing list to get notified.",
    links: {
        home: "Home",
        about: "About",
        contact: "Contact",
        docs: "Docs",
        configurator: "Configurator",
        wiki: "Wiki"
    },
    pages: {
        index: {
            meta: {
                title: 'Integral Motions — High-precision BLDC motor controllers',
                description: 'Super fast, accurate, and efficient BLDC motor controllers with high-end positional control.',
                ogTitle: 'Integral Motions',
                ogDescription: 'Super fast, accurate, efficient BLDC motor controllers.',
            },
            title: "Super fast, accurate and efficient BLDC motor controllers",
            description: "Drop-in upgrade for any BLDC. Designed for high-end positional control with ultra-low latency loops.",
            requestDemo: "Request a demo",
            readDocs: "Read docs",
            bulletPoints: {
                controlLoop: "100 kHz+ control loop",
                precision: "µrad positioning",
                torque: "High torque density"
            },
            imageBadge: "Industrial-grade",
            valueProposition: {
                deterministic: {
                    text: "Deterministic control",
                    description: "Hard real-time loops, jitter-free timing, stable at high speeds."
                },
                feedback: {
                    text: "Precision feedback",
                    description: "Encoder & resolver support with advanced observers and calibration."
                },
                upgrade: {
                    text: "Drop-in upgrade",
                    description: "Compatible with existing BLDC motors and common bus voltages."
                }
            },
            highlights: {
                highlight1: "Field-oriented control (FOC) with feedforward",
                highlight2: "Advanced anti-cogging + friction compensation",
                highlight3: "Safety: OCP/OVP/OTP, soft-limits, E-stop IO",
                highlight4: "Interfaces: CAN, EtherCAT (roadmap), UART",
                highlight5: "SDK & REST for rapid integration",
            },
            pilot: "Pilot with us",
            quickstart: "Quickstart",
            products: {
                dualMotorDriver: {
                    title: "Dual motor driver",
                    description: "Our flagship upgrade module for peak accuracy and response. Built for robotics, CNC, gimbals, and precision stages.",
                    specifications: {
                        loopRate: {
                            title: "LOOP RATE",
                            value: "100 kHz"
                        },
                        voltage: {
                            title: "VOLTAGE",
                            value: "12-24 V"
                        },
                        current: {
                            title: "CURRENT",
                            value: "20A Continiously"
                        },
                        encoder: {
                            title: "ENCODER",
                            value: "SPI, ABZ, 14 bit"
                        }
                    }
                }
            },
            callToAction: {
                title: "Ready to upgrade your BLDC performance",
                description: "Tell us about your motor and application — we'll propose an optimal setup.",
                contactSales: "Contact sales",
                viewDocs: "View docs"
            }
        },
        contact: {
            title: "Contact us",
            form: {
                firstName: "First name",
                lastName: "Last name",
                company: "Company",
                email: "Email",
                phone: "Phone",
                message: "Message",
                send: "Send",
                replyWithin: "Replies within 3 business day",
            },
            contactInfo: "Contact info",
            links: "Quick links",
            country: "Netherlands (EU)"
        },
        about: {
            title: "About Integral Motion",
            description: "Plug-and-play high-performance motor control for everyone.",
            ourMission: {
                title: "Our Mission",
                text: "We're two co-owners building motor controllers that make pro-grade motion control simple: faster, more precise, and more efficient, just plug and play. Our goal is to bring high-performance motor control to everyone, from small projects to industrial systems.",
            },
            atAGlance: "At a Glance",
            whatWeBuild: {
                title: "What We Build",
                text: "Upgrade controllers for BLDC motors with advanced algorithms, high-end positional control, and painless integration. Designed for people who need precision and efficiency without complexity.",
            },
            whyItMatters: {
                title: "Why It Matters",
                text: "High performance shouldn't be complicated. We bring top-tier control to everyone by removing the complexity — letting you focus on your application, not configuration."
            },
            team: {
                title: "Our Team",
                JosWigchert: {
                    name: "Jos Wigchert",
                    title: "co-owner",
                    occupations: "Software • Architecture • Hardware • Communication"
                },
                WilliamKers: {
                    name: "William Kers",
                    title: "co-owner",
                    occupations: "Control • Tuning • Mechanical • Hardware"
                }
            }
        }
    },
    footer: {
        copyright: "© {year} Integral Motion. All rights reserved.",
    }
} as const