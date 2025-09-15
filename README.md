# Integral Motions Configurator

## Prerequisites
To run this project you need to have bun installed. To install bun follow the install guide [here](https://bun.com)

## Setup

To run the program follow the steps below:

```bash
bun install
bun run dev -o
```

You should have a development server running on `http://localhost:3000`.

## Component Library

We use Nuxt UI as our component library, the docs for this are available [here](https://ui.nuxt.com/getting-started)

## Usage

This site can be used to configure the motor driver. 
Below you can see a screenshot of the application.
To start, simply connect the device using usb to your device.
You can now click the **connect** button on the page, this will connect with your device and display the options you can configure.
When you change a configuration, it will be marked. 
All marked changes will be sent back to the device when you cluck the **save** button. 
After saving it will read the configuration again and display the settings with the changes applied.

<img width="1470" height="837" alt="image" src="https://github.com/user-attachments/assets/5b19d093-8ac1-4019-a577-0ccfed02fcbe" />
