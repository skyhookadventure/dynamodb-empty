/* eslint-disable no-await-in-loop */
import { DynamoDB } from "aws-sdk";
import minimist from "minimist";

/**
 * Get the pk and sk if set, as an array
 */
export async function getTableKeys(
  TableName: string,
  endpoint?: string
): Promise<Array<string>> {
  const db = new DynamoDB({ endpoint });
  const tableInfo = await db.describeTable({ TableName }).promise();
  const keySchema = tableInfo!.Table!.KeySchema as DynamoDB.KeySchema;
  return keySchema.map((key) => key.AttributeName);
}

/**
 * Convert an item into a batchWrite delete request
 */
export function itemToDeleteRequest(item: DynamoDB.AttributeMap) {
  const Key = (item as unknown) as DynamoDB.DocumentClient.Key;
  return { DeleteRequest: { Key } };
}

/**
 * Delete a batch of up to 25 items
 */
export function deleteBatchItems(
  TableName: string,
  items: DynamoDB.ItemList,
  endpoint?: string
) {
  const db = new DynamoDB.DocumentClient({ endpoint });
  return db
    .batchWrite({
      RequestItems: {
        [TableName]: items.map((item) => itemToDeleteRequest(item)),
      },
    })
    .promise();
}

/**
 * Delete all items
 */
export async function deleteAllItems(
  TableName: string,
  AttributesToGet: DynamoDB.AttributeNameList,
  endpoint?: string
) {
  let firstRun = true;
  let LastEvaluatedKey: DynamoDB.DocumentClient.Key | undefined;

  // Store the delete batch requests as promises so that we can run these asynchronously
  const deleteBatchPromises: Array<Promise<any>> = [];

  console.log("Running...");

  while (firstRun || LastEvaluatedKey) {
    firstRun = false;
    const db = new DynamoDB.DocumentClient({ endpoint });
    const res = await db
      .scan({
        TableName,
        AttributesToGet,
        Limit: 25,
        ExclusiveStartKey: LastEvaluatedKey,
      })
      .promise();

    if (res.Items && res.Count) {
      LastEvaluatedKey = res.LastEvaluatedKey;
      const deletePromise = deleteBatchItems(TableName, res.Items, endpoint);
      deleteBatchPromises.push(deletePromise);
    } else {
      break;
    }
  }

  // Wait for all the delete batch requests to finish
  await Promise.all(deleteBatchPromises);
  console.log("Done");
}

/**
 * Run the whole binary
 */
export default async function runBin(
  processArguments: Array<string>,
  endpoint?: string
): Promise<any> {
  const argv = minimist(processArguments);

  // Handle help
  if (argv.help) {
    console.log(
      "Run as dynamodb-empty --table TABLENAME to empty a table completely"
    );
    return;
  }

  // Get the table name
  const tableName = argv.table;
  if (!tableName) throw new Error("Table name must be provided with --name");
  console.log(`Emptying table ${tableName}`);

  // Get the table hash/sort keys
  const tableKeys = await getTableKeys(tableName, endpoint);
  console.log("Table keys are ", JSON.stringify(tableKeys));

  // Run
  await deleteAllItems(tableName, tableKeys, endpoint);
}

export interface TableKeys {
  pk: string;
  sk: string;
}
