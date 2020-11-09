/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
import DynamoDbLocal from "dynamodb-local";
import { DynamoDB } from "aws-sdk";
import { ChildProcess } from "child_process";
import { v4 } from "uuid";
import runBin, { getTableKeys, deleteAllItems, itemToDeleteRequest } from ".";

/**
 * Setup
 */

process.env.AWS_REGION = "eu-west-1";

const dynamoLocalPort = 8000;
const endpoint = `http://localhost:${dynamoLocalPort}`;
const TableName = "Name";
const db = new DynamoDB.DocumentClient({ endpoint });
let child: ChildProcess;

beforeAll(async () => {
  // Launch a local dynamodb instance
  child = await DynamoDbLocal.launch(dynamoLocalPort);

  // Create the Accounting table
  const dynamo = new DynamoDB({ endpoint });
  await dynamo
    .createTable({
      TableName,
      AttributeDefinitions: [
        {
          AttributeName: "pk",
          AttributeType: "S",
        },
        {
          AttributeName: "sk",
          AttributeType: "S",
        },
      ],
      KeySchema: [
        {
          AttributeName: "pk",
          KeyType: "HASH",
        },
        {
          AttributeName: "sk",
          KeyType: "SORT",
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    })
    .promise();
});

beforeEach(async () => {
  // Create some items
  const items: DynamoDB.DocumentClient.BatchWriteItemInput = {
    RequestItems: { [TableName]: [] },
  };
  for (let i = 0; i < 25; i++) {
    items.RequestItems[TableName].push({
      PutRequest: {
        Item: {
          pk: v4(),
          sk: v4(),
          otherElement: "hi",
        },
      },
    });
  }

  for (let i = 0; i < 2; i++) {
    await db.batchWrite(items).promise();
  }
});

afterAll(async () => {
  await DynamoDbLocal.stopChild(child);
});

/**
 * Tests
 */

describe("getTableKeys", () => {
  it("returns the correct pk and sk", async () => {
    const res = await getTableKeys(TableName, endpoint);
    expect(res).toEqual(["pk", "sk"]);
  });
});

describe("itemToDeleteRequest", () => {
  it("converts to match the snapshot", () => {
    const item = {
      sk: "4e1afdfc-92f7-42fd-9ff5-9c71f16d47a8",
      pk: "090fd16e-4062-4eda-a245-1cb651114f24",
    } as DynamoDB.AttributeMap;
    const res = itemToDeleteRequest(item);
    expect(res).toMatchInlineSnapshot(`
      Object {
        "DeleteRequest": Object {
          "Key": Object {
            "pk": "090fd16e-4062-4eda-a245-1cb651114f24",
            "sk": "4e1afdfc-92f7-42fd-9ff5-9c71f16d47a8",
          },
        },
      }
    `);
  });
});

describe("deleteAllItems", () => {
  it("deletes all the items", async () => {
    await deleteAllItems(TableName, ["pk", "sk"], endpoint);
    const items = await db.scan({ TableName }).promise();
    expect(items.Count).toBe(0);
  });
});

describe("runBin", () => {
  it("runs help without  errors", async () => {
    await runBin(["--help"]);
  });

  it("deletes all the items", async () => {
    await runBin(["--table", TableName], endpoint);
    const items = await db.scan({ TableName }).promise();
    expect(items.Count).toBe(0);
  });

  it("errors if no table name is set", async () => {
    await expect(runBin([], endpoint)).rejects.toThrow();
  });
});
