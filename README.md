# DynamoDB Empty

[![Built with
typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://www.typescriptlang.org/)
[![version](https://badgen.net/npm/v/dynamodb-empty)](https://www.npmjs.com/package/dynamodb-empty)
![dependants](https://badgen.net/npm/dependents/dynamodb-empty) ![license](https://badgen.net/npm/license/dynamodb-empty)

FEDs coming round to check you Bitcoin log? Wipe those DynamoDB tables fast.

## Why

When you're running tests with small amounts of data, it's much faster to wipe a Dynamo DB table than delete/recreate it.

**Do not use with large amounts of data.** It's much cheaper to delete/recreate the table, as this module will incur a
read & write cost for every item in your table (under the hood it scans all items and then deletes one at a time).

## Important

This is for use on small tables only, in testing environments. For large tables it is much more efficient to delete and
re-create the entire table.

## Use

### Install globally

```shell
yarn global add dynamodb-empty
```

Or:

```shell
npm install -g dynamodb-empty
```

## Run on a table

```shell
dynamodb-empty --table tableName
```

## Checklist

| CD Feature | Provided                                |
| ---------- | --------------------------------------- |
| ✅         | Typescript                              |
| ✅         | Linting (AirBnB + Prettier)             |
| ✅         | Unit tests (Jest)                       |
| ✅         | Coverage check (ideally 100% with Jest) |
| ✅         | Github Continuous Deployment            |

## Built by Skyhook

This module is contributed by the team at [Skyhook](https://www.skyhookadventure.com/).
