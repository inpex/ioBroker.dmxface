![Logo](admin/dmxface.png)
http://www.dmxface.at
# ioBroker.dmxface 1.0.2
Adapter for DMXface, programmable IO controller with <br>
 DMX OUT bus<br>
 DMX IN bus<br>
 8 to 16 INports with analog to digital support for all channels (16 ports with the IO8 extension)<br>
 8 to 16 OUTports (16 ports with the IO8 extension)<br>
 6 PWM LED driver ports up to 1A each channel<br>
 IR receiver and transmitter port<br>
 RS485 Bus for the connection of up to 8 LCD touch displays with 2.4 or 5 inches.<br>
 LAN Interface supporting up to 7 individual configurable sockets<br>
 USB Port for programming and communication<br>
 RTC Clock with day of week / date<br>
 Optional RS232, KNX, audio triggering, ...<br>
 
 224 DMX channels  (DMXfaceXP pro supports 512+32 DMX channels)<br>
 180 Storeable scenes with fade times 0.0 to 165 Sec. <br>
 28  Programms<br>
 64  Event triggers (DMXfaceXP pro supports 80 triggers)<br>
 4 	 Recordable timelines with 50msek resolution<br>
 32	 Sendsequences<br>

Dokumentation and communication protocoll downloads: http://www.spl-technik.at/index.php/dmxface-downloads
 
## DMXface adapter for ioBroker
This adapter connects the DMXfaceXP controller with ioBroker.
The communication protocoll used is the DMXface ACTIVE SEND protocoll.

## Setup the DMXface
To configure the DMXface controller, you need the 'DMXface Console' downloadable at http://www.dmxface.at<br>
After connecting by USB, you can access and change the controllers setup und network settings as well programm the controller.<br>

### DMXface network settings (Menu: DMXface settings / Network setup)<br>
Here you can configure a valid IP address for the DMXface controller.
To get the DMXface connected to the IO Broker you have as well to setup the socket 6 or 7:
Set it to 'TCP SERVER', 'ACTIVE SEND PROTOCOLL' with a valid PORT (Default = 6000).<br>

### DMXface setup settings (Menu: DMXface settings / Basic setup)<br>
If you want to receive IO Port changes or IR Remote control data, then enable 'LAN SOCKET 6 or 7 sends ACTS messages' and select 
Outport change, Inport change and Infrared receive in the 'Send ACTS message at event' area below.<br>

To receive DMX channel values enable 'LAN SOCKET 6 or 7 sends DMX channel values.<br>
Choose the number of DMXchannels that should be transferred to ioBroker and the intervall within the channels are sent.
Save the changes, done.<br>

## Add adapter to ioBroker
Add the DMXface adapter from github  https://github.com/DMXface/ioBroker.dmxface.git
Create an instance of the adapter.

## Adapter configuration
Adapter configuration:<br>
IP address:  Same as used for the DMXfaceXP controller<br>
Port: Same as configured in the network socket 6 or 7<br>
Last DMX channel used: Number of DMX state objects that will be created when the DMXface adapter ist started.<br>
Additional channel requests:<br>
Here you can list addition ports that should be requested cyclic by ioBroker.<br>
DMXface covers the possibility to process values of DMX channels, AD values of INPORT or BUS ports by a conversion table. 
The request reads the (converted) value of a listed port an forwards it to a state object as floating value.<br>

Request timing if addition channels are listed (ms): This value specifies the timing within the additional channels are requested one by one.<br>

### 1.0.2
released for use with DMXfaceXP Controller

##  Changelog
1.0.0  Initial release<br>
1.0.1  Bugfixes (reconnect procedure after loosing TCP connection)<br>
1.0.2  File cleanup+ Bugfix (List of additional ports causes error @ first start due to NULL value<br>
## License
MIT License<br>

Copyright (c) 2019 SPaL Oliver Hufnagl <mail@dmxface.at><br>

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