---
title: Creating a CHIP-8 emulator
description: My brief introduciton to writing emulators.
date: 01 April 2021 00:46:00 GMT
slug: creating-a-chip8-emulator
tags: emulator|chip8
---

I was looking for something cool and was familiar with emulators and thought about what it would take to actually get into emulator development. After a brief search a few people recommend starting off trying to implement a CHIP-8 emulator/interpretor. This is because CHIP-8 is actually just a programming language. (Hence interptetor). And therefore the "architecture" is simple. You just need to implement a bunch of instructions (aka opcodes), and then draw what ever is produced in the output buffer. There are only 35 opcodes and most of them are very simple to implement.

I used [Cowgod's technical reference](http://devernay.free.fr/hacks/chip8/C8TECH10.HTM) for the opcodes when implementing them. Doing so requires good familiarity with bit manipulation operators in your chosen language, particularly the shift operators (commonly `<<` and `>>`).

I started this in C# and implemented all the opcodes. However once it was time to draw to the screen, I realized that there isn't a simple "canvas" graphics library. Well at least not in .NET Core as it has to be platform independant. This basically meant that I had to use opengl to draw. However I wasn't up for doing that just now as opengl is very verbose. It would be like creating your own paint from scratch in order to paint a small door. So instead I decided to re-implement everything in JS. At least now I can present it nicely in a website!

Luckily I could just copy and paste most of the code over, and then do some cheeky find and replaces to fix things up. Although javascript has no strict type system, it does have typed arrays. UInt8Array was probably the most used. I will now show you some of the silly mistakes I made when implementing it.

One mistake I made was when implementing the `0x2nnn` (Call addr) instruction. At first I would push the current program counter to the stack and then set the program count to nnn (the location of the function we are calling). However this will actually cause an infinite loop. Because when the function returns, it will pop the stack and set the program counter back... to the location of the function call again. So what I actually needed to do was either increment the program counter before pushing onto the stack or after poping it from the stack. This sounds so obvious in hignsight but I was blindly following the technical reference wording.

```js
case 0x2000: // 2nnn: CALL addr
    this._stack_ptr++;

    // put return addr in the stack
    // add 2 so we store the next instruction, otherwise we will cause an infinite loop!
    this._stack[this._stack_ptr] = this._program_counter + 2;

    this._program_counter = (this._opcode & 0x0FFF);
    break;
```

The next isn't really a mistake, but it was unclear how exactly to interpret the graphics buffer. Eventually After some searching I found out that its stored "column wise" rendering from y = 0 down for each x (assuming (0,0) is the top left corner).

```js
for (let i = 0; i < (64 * 32); i++) {
    let x = i % 64;
    let y = Math.floor(i / 64);
    ...
}
```

Before the above I somehow managed to render a 90 degree rotaded version!

Overall I'd say that implementing the Chip-8 interpreter/emulator was a pretty interesting experience. I didn't implement sound (which is just a timer that eventually plays a buzzer sound basically). But otherwise it's basically a giant switch statement where we read an instruction and then execute it. And eventually we need to draw the frame buffer to the screen. Apparently Chip-8 is too simple, and doesn't really help if say you wanted to then go on and write a gameboy emulator (which I may do!) as for example such an emulator requires a lot of synchronization between components.
