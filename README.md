# README

Welcome to Stable Stay!

This is a pretty silly adventure for helping me managed guests at my personal
mountain lodge in Hakuba, Japan.  Rather than doing something simple like
maintaining a Google Spreadsheet, I've built this, a booking website that
generates AI images for every booking (and every person joining a booking).  To
make it even more silly, you can chat with auto-generated AI chatbot profiles
based on each image.

We don't have a running instance yet since it's still in development and I
don't want to manage database migrations right now, but soon such a thing will
be live.

The whole stack is optimized to run on a single machine with one NVIDIA RTX
A6000, a beefy but affordable GPU.  More GPUs of course would be better and
faster, but this is minimally sufficient.

## Basics

This is build ontop of [RedwoodJS](https://redwoodjs.com) and pairs with two
backend Generative AI services: [Surface
Chat](https://github.com/SurfaceData/surfacechat) and
[FastChat](https://github.com/lm-sys/FastChat).  Together we can create images
for each booking, once approved and then use a multi-modal model to generate a
character profile for each booking.  Finally, we can leverage a cheap open LLM
like Zephyr for chatting.

## Setup

### Pre-requisites

1. Setup a a Postgres database
2. Setup a [Surface Chat](https://github.com/SurfaceData/surfacechat) instance
   with a stable diffusion model paired with some adapters and a LLaVa model.
3. Setup a [FastChat](https://github.com/lm-sys/FastChat) instance with some
   suitable model.  Zephyr is good and fast for prototyping.

### Running

```
yarn install
```

Then start the development server:

```
yarn redwood dev
```

Boom, now you too can be silly.

## TODOs

1. Replicate [this
   demo](https://github.com/redwoodjs/redwoodjs-streaming-realtime-demos/tree/main)
   for doing streaming messages in more places.
2. Document [SurfaceChat](https://github.com/SurfaceData/surfacechat).
