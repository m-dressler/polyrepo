# @md/polyrepo

Allows you to manage a polyrepo of jsr packages keeping them all in sync.

## Installation

Add the following tasks to your deno.json:

```
{
  "tasks": {
    "version": "deno run --allow-read=. --allow-write=. jsr:@md/polyrepo version"
  }
}
```

# Usage

Update repo version: `deno task version <patch/minor/major>`