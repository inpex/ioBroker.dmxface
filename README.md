![Logo](admin/dmxface.png)
# ioBroker.dmxface
www.dmxface.at
## dmxface adapter for ioBroker
This will get the DMXfaceXP adapter.

## Developer manual
To configure the DMXface controller, you need the 'DMXface Console' downloadable on www.dmxface.at.
After connecting with USB you can access and change the (network) setup as well programm the controller.

This IObroker adapter uses the MAIN COMMUNICATION PROTOCOLL to communicate. (Details downloadable www.dmxface.at)
So the DMXfaceXP Controller needs a valid IP address and at least one socket configured to 'TCP SERVER', 'MAIN COMMUNICATION' with a valid PORT (Default = 5000).
DMXfaceXP supports up to 7 simultanously usable network sockets.

Adapter configuration:
IP address:  Same as used for the DMXfaceXP controller
Port: Same as configured in the network socket
Request timing: Cycle in milliseconds within the IO port- and DMX channelstates are requested.
Last DMX channel used: To reduce datatraffic and processing you can limit the number of DMXchannels that are processed by the adapter. DMXface itself processes 224 to 512+32 DMXchannels.

### 0.0.1
not released

##  Changelog


## License
MIT License

Copyright (c) 2019 SPaL Oliver Hufnagl <mail@dmxface.at>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.