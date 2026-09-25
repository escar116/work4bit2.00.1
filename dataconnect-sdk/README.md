# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `default`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListPendingUsers*](#listpendingusers)
  - [*GetUser*](#getuser)
  - [*ListHelpRequests*](#listhelprequests)
  - [*ListApplicationsByApplicant*](#listapplicationsbyapplicant)
  - [*ListApplicationsForMyRequests*](#listapplicationsformyrequests)
  - [*ListMyHelpRequestsWithApplications*](#listmyhelprequestswithapplications)
  - [*ListConversations*](#listconversations)
  - [*ListAllUsers*](#listallusers)
  - [*ListAllHelpRequestsAdmin*](#listallhelprequestsadmin)
  - [*ListAllApplicationsAdmin*](#listallapplicationsadmin)
  - [*GetUserProfile*](#getuserprofile)
- [**Mutations**](#mutations)
  - [*CreateUser*](#createuser)
  - [*UpdateUserStatus*](#updateuserstatus)
  - [*CreateHelpRequest*](#createhelprequest)
  - [*CreateApplication*](#createapplication)
  - [*UpdateApplicationStatus*](#updateapplicationstatus)
  - [*CreateConversation*](#createconversation)
  - [*UpdateHelpRequestStatus*](#updatehelprequeststatus)
  - [*TerminateJob*](#terminatejob)
  - [*CompleteJob*](#completejob)
  - [*DeleteUser*](#deleteuser)
  - [*DeleteApplication*](#deleteapplication)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `default`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@work4abit/dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@work4abit/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@work4abit/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `default` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListPendingUsers
You can execute the `ListPendingUsers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
listPendingUsers(options?: ExecuteQueryOptions): QueryPromise<ListPendingUsersData, undefined>;

interface ListPendingUsersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPendingUsersData, undefined>;
}
export const listPendingUsersRef: ListPendingUsersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPendingUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPendingUsersData, undefined>;

interface ListPendingUsersRef {
  ...
  (dc: DataConnect): QueryRef<ListPendingUsersData, undefined>;
}
export const listPendingUsersRef: ListPendingUsersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPendingUsersRef:
```typescript
const name = listPendingUsersRef.operationName;
console.log(name);
```

### Variables
The `ListPendingUsers` query has no variables.
### Return Type
Recall that executing the `ListPendingUsers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPendingUsersData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListPendingUsersData {
  users: ({
    id: string;
    email: string;
    fullName: string;
    studentId?: string | null;
    facultyReference?: string | null;
    certificateUrl: string;
    verificationStatus: string;
  } & User_Key)[];
}
```
### Using `ListPendingUsers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPendingUsers } from '@work4abit/dataconnect';


// Call the `listPendingUsers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPendingUsers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPendingUsers(dataConnect);

console.log(data.users);

// Or, you can use the `Promise` API.
listPendingUsers().then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

### Using `ListPendingUsers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPendingUsersRef } from '@work4abit/dataconnect';


// Call the `listPendingUsersRef()` function to get a reference to the query.
const ref = listPendingUsersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPendingUsersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.users);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

## GetUser
You can execute the `GetUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
getUser(vars: GetUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserData, GetUserVariables>;

interface GetUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserVariables): QueryRef<GetUserData, GetUserVariables>;
}
export const getUserRef: GetUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUser(dc: DataConnect, vars: GetUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserData, GetUserVariables>;

interface GetUserRef {
  ...
  (dc: DataConnect, vars: GetUserVariables): QueryRef<GetUserData, GetUserVariables>;
}
export const getUserRef: GetUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserRef:
```typescript
const name = getUserRef.operationName;
console.log(name);
```

### Variables
The `GetUser` query requires an argument of type `GetUserVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetUserVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserData {
  user?: {
    id: string;
    email: string;
    fullName: string;
    studentId?: string | null;
    facultyReference?: string | null;
    certificateUrl: string;
    verificationStatus: string;
    preferredRole?: string | null;
    gender?: string | null;
  } & User_Key;
}
```
### Using `GetUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUser, GetUserVariables } from '@work4abit/dataconnect';

// The `GetUser` query requires an argument of type `GetUserVariables`:
const getUserVars: GetUserVariables = {
  id: ..., 
};

// Call the `getUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUser(getUserVars);
// Variables can be defined inline as well.
const { data } = await getUser({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUser(dataConnect, getUserVars);

console.log(data.user);

// Or, you can use the `Promise` API.
getUser(getUserVars).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserRef, GetUserVariables } from '@work4abit/dataconnect';

// The `GetUser` query requires an argument of type `GetUserVariables`:
const getUserVars: GetUserVariables = {
  id: ..., 
};

// Call the `getUserRef()` function to get a reference to the query.
const ref = getUserRef(getUserVars);
// Variables can be defined inline as well.
const ref = getUserRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserRef(dataConnect, getUserVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## ListHelpRequests
You can execute the `ListHelpRequests` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
listHelpRequests(options?: ExecuteQueryOptions): QueryPromise<ListHelpRequestsData, undefined>;

interface ListHelpRequestsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListHelpRequestsData, undefined>;
}
export const listHelpRequestsRef: ListHelpRequestsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listHelpRequests(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListHelpRequestsData, undefined>;

interface ListHelpRequestsRef {
  ...
  (dc: DataConnect): QueryRef<ListHelpRequestsData, undefined>;
}
export const listHelpRequestsRef: ListHelpRequestsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listHelpRequestsRef:
```typescript
const name = listHelpRequestsRef.operationName;
console.log(name);
```

### Variables
The `ListHelpRequests` query has no variables.
### Return Type
Recall that executing the `ListHelpRequests` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListHelpRequestsData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListHelpRequestsData {
  helpRequests: ({
    id: UUIDString;
    title: string;
    description: string;
    budget: number;
    category?: string | null;
    urgency?: string | null;
    deadline?: string | null;
    status?: string | null;
    requester: {
      id: string;
      fullName: string;
      email: string;
      certificateUrl: string;
      verificationStatus: string;
    } & User_Key;
  } & HelpRequest_Key)[];
}
```
### Using `ListHelpRequests`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listHelpRequests } from '@work4abit/dataconnect';


// Call the `listHelpRequests()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listHelpRequests();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listHelpRequests(dataConnect);

console.log(data.helpRequests);

// Or, you can use the `Promise` API.
listHelpRequests().then((response) => {
  const data = response.data;
  console.log(data.helpRequests);
});
```

### Using `ListHelpRequests`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listHelpRequestsRef } from '@work4abit/dataconnect';


// Call the `listHelpRequestsRef()` function to get a reference to the query.
const ref = listHelpRequestsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listHelpRequestsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.helpRequests);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.helpRequests);
});
```

## ListApplicationsByApplicant
You can execute the `ListApplicationsByApplicant` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
listApplicationsByApplicant(vars: ListApplicationsByApplicantVariables, options?: ExecuteQueryOptions): QueryPromise<ListApplicationsByApplicantData, ListApplicationsByApplicantVariables>;

interface ListApplicationsByApplicantRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListApplicationsByApplicantVariables): QueryRef<ListApplicationsByApplicantData, ListApplicationsByApplicantVariables>;
}
export const listApplicationsByApplicantRef: ListApplicationsByApplicantRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listApplicationsByApplicant(dc: DataConnect, vars: ListApplicationsByApplicantVariables, options?: ExecuteQueryOptions): QueryPromise<ListApplicationsByApplicantData, ListApplicationsByApplicantVariables>;

interface ListApplicationsByApplicantRef {
  ...
  (dc: DataConnect, vars: ListApplicationsByApplicantVariables): QueryRef<ListApplicationsByApplicantData, ListApplicationsByApplicantVariables>;
}
export const listApplicationsByApplicantRef: ListApplicationsByApplicantRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listApplicationsByApplicantRef:
```typescript
const name = listApplicationsByApplicantRef.operationName;
console.log(name);
```

### Variables
The `ListApplicationsByApplicant` query requires an argument of type `ListApplicationsByApplicantVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListApplicationsByApplicantVariables {
  userId: string;
}
```
### Return Type
Recall that executing the `ListApplicationsByApplicant` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListApplicationsByApplicantData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListApplicationsByApplicantData {
  applications: ({
    id: UUIDString;
    priceOffer: number;
    message: string;
    status: string;
    createdAt: DateString;
    helpRequest: {
      id: UUIDString;
      title: string;
      budget: number;
      urgency?: string | null;
      deadline?: string | null;
      category?: string | null;
      requester: {
        id: string;
        fullName: string;
      } & User_Key;
    } & HelpRequest_Key;
  } & Application_Key)[];
}
```
### Using `ListApplicationsByApplicant`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listApplicationsByApplicant, ListApplicationsByApplicantVariables } from '@work4abit/dataconnect';

// The `ListApplicationsByApplicant` query requires an argument of type `ListApplicationsByApplicantVariables`:
const listApplicationsByApplicantVars: ListApplicationsByApplicantVariables = {
  userId: ..., 
};

// Call the `listApplicationsByApplicant()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listApplicationsByApplicant(listApplicationsByApplicantVars);
// Variables can be defined inline as well.
const { data } = await listApplicationsByApplicant({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listApplicationsByApplicant(dataConnect, listApplicationsByApplicantVars);

console.log(data.applications);

// Or, you can use the `Promise` API.
listApplicationsByApplicant(listApplicationsByApplicantVars).then((response) => {
  const data = response.data;
  console.log(data.applications);
});
```

### Using `ListApplicationsByApplicant`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listApplicationsByApplicantRef, ListApplicationsByApplicantVariables } from '@work4abit/dataconnect';

// The `ListApplicationsByApplicant` query requires an argument of type `ListApplicationsByApplicantVariables`:
const listApplicationsByApplicantVars: ListApplicationsByApplicantVariables = {
  userId: ..., 
};

// Call the `listApplicationsByApplicantRef()` function to get a reference to the query.
const ref = listApplicationsByApplicantRef(listApplicationsByApplicantVars);
// Variables can be defined inline as well.
const ref = listApplicationsByApplicantRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listApplicationsByApplicantRef(dataConnect, listApplicationsByApplicantVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.applications);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.applications);
});
```

## ListApplicationsForMyRequests
You can execute the `ListApplicationsForMyRequests` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
listApplicationsForMyRequests(vars: ListApplicationsForMyRequestsVariables, options?: ExecuteQueryOptions): QueryPromise<ListApplicationsForMyRequestsData, ListApplicationsForMyRequestsVariables>;

interface ListApplicationsForMyRequestsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListApplicationsForMyRequestsVariables): QueryRef<ListApplicationsForMyRequestsData, ListApplicationsForMyRequestsVariables>;
}
export const listApplicationsForMyRequestsRef: ListApplicationsForMyRequestsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listApplicationsForMyRequests(dc: DataConnect, vars: ListApplicationsForMyRequestsVariables, options?: ExecuteQueryOptions): QueryPromise<ListApplicationsForMyRequestsData, ListApplicationsForMyRequestsVariables>;

interface ListApplicationsForMyRequestsRef {
  ...
  (dc: DataConnect, vars: ListApplicationsForMyRequestsVariables): QueryRef<ListApplicationsForMyRequestsData, ListApplicationsForMyRequestsVariables>;
}
export const listApplicationsForMyRequestsRef: ListApplicationsForMyRequestsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listApplicationsForMyRequestsRef:
```typescript
const name = listApplicationsForMyRequestsRef.operationName;
console.log(name);
```

### Variables
The `ListApplicationsForMyRequests` query requires an argument of type `ListApplicationsForMyRequestsVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListApplicationsForMyRequestsVariables {
  userId: string;
}
```
### Return Type
Recall that executing the `ListApplicationsForMyRequests` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListApplicationsForMyRequestsData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListApplicationsForMyRequestsData {
  applications: ({
    id: UUIDString;
    priceOffer: number;
    message: string;
    status: string;
    createdAt: DateString;
    applicant: {
      id: string;
      fullName: string;
      email: string;
    } & User_Key;
    helpRequest: {
      id: UUIDString;
      title: string;
      urgency?: string | null;
      deadline?: string | null;
      requesterId: string;
    } & HelpRequest_Key;
  } & Application_Key)[];
}
```
### Using `ListApplicationsForMyRequests`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listApplicationsForMyRequests, ListApplicationsForMyRequestsVariables } from '@work4abit/dataconnect';

// The `ListApplicationsForMyRequests` query requires an argument of type `ListApplicationsForMyRequestsVariables`:
const listApplicationsForMyRequestsVars: ListApplicationsForMyRequestsVariables = {
  userId: ..., 
};

// Call the `listApplicationsForMyRequests()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listApplicationsForMyRequests(listApplicationsForMyRequestsVars);
// Variables can be defined inline as well.
const { data } = await listApplicationsForMyRequests({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listApplicationsForMyRequests(dataConnect, listApplicationsForMyRequestsVars);

console.log(data.applications);

// Or, you can use the `Promise` API.
listApplicationsForMyRequests(listApplicationsForMyRequestsVars).then((response) => {
  const data = response.data;
  console.log(data.applications);
});
```

### Using `ListApplicationsForMyRequests`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listApplicationsForMyRequestsRef, ListApplicationsForMyRequestsVariables } from '@work4abit/dataconnect';

// The `ListApplicationsForMyRequests` query requires an argument of type `ListApplicationsForMyRequestsVariables`:
const listApplicationsForMyRequestsVars: ListApplicationsForMyRequestsVariables = {
  userId: ..., 
};

// Call the `listApplicationsForMyRequestsRef()` function to get a reference to the query.
const ref = listApplicationsForMyRequestsRef(listApplicationsForMyRequestsVars);
// Variables can be defined inline as well.
const ref = listApplicationsForMyRequestsRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listApplicationsForMyRequestsRef(dataConnect, listApplicationsForMyRequestsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.applications);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.applications);
});
```

## ListMyHelpRequestsWithApplications
You can execute the `ListMyHelpRequestsWithApplications` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
listMyHelpRequestsWithApplications(vars: ListMyHelpRequestsWithApplicationsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyHelpRequestsWithApplicationsData, ListMyHelpRequestsWithApplicationsVariables>;

interface ListMyHelpRequestsWithApplicationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMyHelpRequestsWithApplicationsVariables): QueryRef<ListMyHelpRequestsWithApplicationsData, ListMyHelpRequestsWithApplicationsVariables>;
}
export const listMyHelpRequestsWithApplicationsRef: ListMyHelpRequestsWithApplicationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyHelpRequestsWithApplications(dc: DataConnect, vars: ListMyHelpRequestsWithApplicationsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyHelpRequestsWithApplicationsData, ListMyHelpRequestsWithApplicationsVariables>;

interface ListMyHelpRequestsWithApplicationsRef {
  ...
  (dc: DataConnect, vars: ListMyHelpRequestsWithApplicationsVariables): QueryRef<ListMyHelpRequestsWithApplicationsData, ListMyHelpRequestsWithApplicationsVariables>;
}
export const listMyHelpRequestsWithApplicationsRef: ListMyHelpRequestsWithApplicationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyHelpRequestsWithApplicationsRef:
```typescript
const name = listMyHelpRequestsWithApplicationsRef.operationName;
console.log(name);
```

### Variables
The `ListMyHelpRequestsWithApplications` query requires an argument of type `ListMyHelpRequestsWithApplicationsVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListMyHelpRequestsWithApplicationsVariables {
  userId: string;
}
```
### Return Type
Recall that executing the `ListMyHelpRequestsWithApplications` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyHelpRequestsWithApplicationsData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMyHelpRequestsWithApplicationsData {
  helpRequests: ({
    id: UUIDString;
    title: string;
    budget: number;
    status?: string | null;
    urgency?: string | null;
    deadline?: string | null;
    category?: string | null;
    description: string;
    applications_on_helpRequest: ({
      id: UUIDString;
      priceOffer: number;
      message: string;
      status: string;
      applicant: {
        id: string;
        fullName: string;
        studentId?: string | null;
      } & User_Key;
    } & Application_Key)[];
  } & HelpRequest_Key)[];
}
```
### Using `ListMyHelpRequestsWithApplications`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyHelpRequestsWithApplications, ListMyHelpRequestsWithApplicationsVariables } from '@work4abit/dataconnect';

// The `ListMyHelpRequestsWithApplications` query requires an argument of type `ListMyHelpRequestsWithApplicationsVariables`:
const listMyHelpRequestsWithApplicationsVars: ListMyHelpRequestsWithApplicationsVariables = {
  userId: ..., 
};

// Call the `listMyHelpRequestsWithApplications()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyHelpRequestsWithApplications(listMyHelpRequestsWithApplicationsVars);
// Variables can be defined inline as well.
const { data } = await listMyHelpRequestsWithApplications({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyHelpRequestsWithApplications(dataConnect, listMyHelpRequestsWithApplicationsVars);

console.log(data.helpRequests);

// Or, you can use the `Promise` API.
listMyHelpRequestsWithApplications(listMyHelpRequestsWithApplicationsVars).then((response) => {
  const data = response.data;
  console.log(data.helpRequests);
});
```

### Using `ListMyHelpRequestsWithApplications`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyHelpRequestsWithApplicationsRef, ListMyHelpRequestsWithApplicationsVariables } from '@work4abit/dataconnect';

// The `ListMyHelpRequestsWithApplications` query requires an argument of type `ListMyHelpRequestsWithApplicationsVariables`:
const listMyHelpRequestsWithApplicationsVars: ListMyHelpRequestsWithApplicationsVariables = {
  userId: ..., 
};

// Call the `listMyHelpRequestsWithApplicationsRef()` function to get a reference to the query.
const ref = listMyHelpRequestsWithApplicationsRef(listMyHelpRequestsWithApplicationsVars);
// Variables can be defined inline as well.
const ref = listMyHelpRequestsWithApplicationsRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyHelpRequestsWithApplicationsRef(dataConnect, listMyHelpRequestsWithApplicationsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.helpRequests);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.helpRequests);
});
```

## ListConversations
You can execute the `ListConversations` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
listConversations(vars: ListConversationsVariables, options?: ExecuteQueryOptions): QueryPromise<ListConversationsData, ListConversationsVariables>;

interface ListConversationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListConversationsVariables): QueryRef<ListConversationsData, ListConversationsVariables>;
}
export const listConversationsRef: ListConversationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listConversations(dc: DataConnect, vars: ListConversationsVariables, options?: ExecuteQueryOptions): QueryPromise<ListConversationsData, ListConversationsVariables>;

interface ListConversationsRef {
  ...
  (dc: DataConnect, vars: ListConversationsVariables): QueryRef<ListConversationsData, ListConversationsVariables>;
}
export const listConversationsRef: ListConversationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listConversationsRef:
```typescript
const name = listConversationsRef.operationName;
console.log(name);
```

### Variables
The `ListConversations` query requires an argument of type `ListConversationsVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListConversationsVariables {
  userId: string;
}
```
### Return Type
Recall that executing the `ListConversations` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListConversationsData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListConversationsData {
  conversations: ({
    id: UUIDString;
    createdAt: DateString;
    poster: {
      id: string;
      fullName: string;
    } & User_Key;
    applicant: {
      id: string;
      fullName: string;
    } & User_Key;
    application: {
      id: UUIDString;
      status: string;
      priceOffer: number;
      message: string;
      helpRequest: {
        id: UUIDString;
        title: string;
        budget: number;
        urgency?: string | null;
        status?: string | null;
      } & HelpRequest_Key;
    } & Application_Key;
  } & Conversation_Key)[];
}
```
### Using `ListConversations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listConversations, ListConversationsVariables } from '@work4abit/dataconnect';

// The `ListConversations` query requires an argument of type `ListConversationsVariables`:
const listConversationsVars: ListConversationsVariables = {
  userId: ..., 
};

// Call the `listConversations()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listConversations(listConversationsVars);
// Variables can be defined inline as well.
const { data } = await listConversations({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listConversations(dataConnect, listConversationsVars);

console.log(data.conversations);

// Or, you can use the `Promise` API.
listConversations(listConversationsVars).then((response) => {
  const data = response.data;
  console.log(data.conversations);
});
```

### Using `ListConversations`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listConversationsRef, ListConversationsVariables } from '@work4abit/dataconnect';

// The `ListConversations` query requires an argument of type `ListConversationsVariables`:
const listConversationsVars: ListConversationsVariables = {
  userId: ..., 
};

// Call the `listConversationsRef()` function to get a reference to the query.
const ref = listConversationsRef(listConversationsVars);
// Variables can be defined inline as well.
const ref = listConversationsRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listConversationsRef(dataConnect, listConversationsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.conversations);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.conversations);
});
```

## ListAllUsers
You can execute the `ListAllUsers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
listAllUsers(options?: ExecuteQueryOptions): QueryPromise<ListAllUsersData, undefined>;

interface ListAllUsersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllUsersData, undefined>;
}
export const listAllUsersRef: ListAllUsersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAllUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAllUsersData, undefined>;

interface ListAllUsersRef {
  ...
  (dc: DataConnect): QueryRef<ListAllUsersData, undefined>;
}
export const listAllUsersRef: ListAllUsersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAllUsersRef:
```typescript
const name = listAllUsersRef.operationName;
console.log(name);
```

### Variables
The `ListAllUsers` query has no variables.
### Return Type
Recall that executing the `ListAllUsers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAllUsersData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAllUsersData {
  users: ({
    id: string;
    email: string;
    fullName: string;
    studentId?: string | null;
    facultyReference?: string | null;
    certificateUrl: string;
    verificationStatus: string;
    preferredRole?: string | null;
    gender?: string | null;
  } & User_Key)[];
}
```
### Using `ListAllUsers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAllUsers } from '@work4abit/dataconnect';


// Call the `listAllUsers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAllUsers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAllUsers(dataConnect);

console.log(data.users);

// Or, you can use the `Promise` API.
listAllUsers().then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

### Using `ListAllUsers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAllUsersRef } from '@work4abit/dataconnect';


// Call the `listAllUsersRef()` function to get a reference to the query.
const ref = listAllUsersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAllUsersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.users);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

## ListAllHelpRequestsAdmin
You can execute the `ListAllHelpRequestsAdmin` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
listAllHelpRequestsAdmin(options?: ExecuteQueryOptions): QueryPromise<ListAllHelpRequestsAdminData, undefined>;

interface ListAllHelpRequestsAdminRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllHelpRequestsAdminData, undefined>;
}
export const listAllHelpRequestsAdminRef: ListAllHelpRequestsAdminRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAllHelpRequestsAdmin(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAllHelpRequestsAdminData, undefined>;

interface ListAllHelpRequestsAdminRef {
  ...
  (dc: DataConnect): QueryRef<ListAllHelpRequestsAdminData, undefined>;
}
export const listAllHelpRequestsAdminRef: ListAllHelpRequestsAdminRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAllHelpRequestsAdminRef:
```typescript
const name = listAllHelpRequestsAdminRef.operationName;
console.log(name);
```

### Variables
The `ListAllHelpRequestsAdmin` query has no variables.
### Return Type
Recall that executing the `ListAllHelpRequestsAdmin` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAllHelpRequestsAdminData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAllHelpRequestsAdminData {
  helpRequests: ({
    id: UUIDString;
    title: string;
    budget: number;
    status?: string | null;
    requester: {
      id: string;
      fullName: string;
    } & User_Key;
  } & HelpRequest_Key)[];
}
```
### Using `ListAllHelpRequestsAdmin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAllHelpRequestsAdmin } from '@work4abit/dataconnect';


// Call the `listAllHelpRequestsAdmin()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAllHelpRequestsAdmin();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAllHelpRequestsAdmin(dataConnect);

console.log(data.helpRequests);

// Or, you can use the `Promise` API.
listAllHelpRequestsAdmin().then((response) => {
  const data = response.data;
  console.log(data.helpRequests);
});
```

### Using `ListAllHelpRequestsAdmin`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAllHelpRequestsAdminRef } from '@work4abit/dataconnect';


// Call the `listAllHelpRequestsAdminRef()` function to get a reference to the query.
const ref = listAllHelpRequestsAdminRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAllHelpRequestsAdminRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.helpRequests);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.helpRequests);
});
```

## ListAllApplicationsAdmin
You can execute the `ListAllApplicationsAdmin` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
listAllApplicationsAdmin(options?: ExecuteQueryOptions): QueryPromise<ListAllApplicationsAdminData, undefined>;

interface ListAllApplicationsAdminRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllApplicationsAdminData, undefined>;
}
export const listAllApplicationsAdminRef: ListAllApplicationsAdminRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAllApplicationsAdmin(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAllApplicationsAdminData, undefined>;

interface ListAllApplicationsAdminRef {
  ...
  (dc: DataConnect): QueryRef<ListAllApplicationsAdminData, undefined>;
}
export const listAllApplicationsAdminRef: ListAllApplicationsAdminRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAllApplicationsAdminRef:
```typescript
const name = listAllApplicationsAdminRef.operationName;
console.log(name);
```

### Variables
The `ListAllApplicationsAdmin` query has no variables.
### Return Type
Recall that executing the `ListAllApplicationsAdmin` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAllApplicationsAdminData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAllApplicationsAdminData {
  applications: ({
    id: UUIDString;
    status: string;
    priceOffer: number;
    applicant: {
      id: string;
      fullName: string;
    } & User_Key;
    helpRequest: {
      id: UUIDString;
      title: string;
    } & HelpRequest_Key;
  } & Application_Key)[];
}
```
### Using `ListAllApplicationsAdmin`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAllApplicationsAdmin } from '@work4abit/dataconnect';


// Call the `listAllApplicationsAdmin()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAllApplicationsAdmin();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAllApplicationsAdmin(dataConnect);

console.log(data.applications);

// Or, you can use the `Promise` API.
listAllApplicationsAdmin().then((response) => {
  const data = response.data;
  console.log(data.applications);
});
```

### Using `ListAllApplicationsAdmin`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAllApplicationsAdminRef } from '@work4abit/dataconnect';


// Call the `listAllApplicationsAdminRef()` function to get a reference to the query.
const ref = listAllApplicationsAdminRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAllApplicationsAdminRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.applications);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.applications);
});
```

## GetUserProfile
You can execute the `GetUserProfile` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
getUserProfile(vars: GetUserProfileVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserProfileData, GetUserProfileVariables>;

interface GetUserProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserProfileVariables): QueryRef<GetUserProfileData, GetUserProfileVariables>;
}
export const getUserProfileRef: GetUserProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserProfile(dc: DataConnect, vars: GetUserProfileVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserProfileData, GetUserProfileVariables>;

interface GetUserProfileRef {
  ...
  (dc: DataConnect, vars: GetUserProfileVariables): QueryRef<GetUserProfileData, GetUserProfileVariables>;
}
export const getUserProfileRef: GetUserProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserProfileRef:
```typescript
const name = getUserProfileRef.operationName;
console.log(name);
```

### Variables
The `GetUserProfile` query requires an argument of type `GetUserProfileVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetUserProfileVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetUserProfile` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserProfileData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserProfileData {
  user?: {
    id: string;
    email: string;
    fullName: string;
    studentId?: string | null;
    certificateUrl: string;
    verificationStatus: string;
    applications_on_applicant: ({
      id: UUIDString;
      status: string;
    } & Application_Key)[];
    helpRequests_on_requester: ({
      id: UUIDString;
      status?: string | null;
    } & HelpRequest_Key)[];
  } & User_Key;
}
```
### Using `GetUserProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserProfile, GetUserProfileVariables } from '@work4abit/dataconnect';

// The `GetUserProfile` query requires an argument of type `GetUserProfileVariables`:
const getUserProfileVars: GetUserProfileVariables = {
  id: ..., 
};

// Call the `getUserProfile()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserProfile(getUserProfileVars);
// Variables can be defined inline as well.
const { data } = await getUserProfile({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserProfile(dataConnect, getUserProfileVars);

console.log(data.user);

// Or, you can use the `Promise` API.
getUserProfile(getUserProfileVars).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetUserProfile`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserProfileRef, GetUserProfileVariables } from '@work4abit/dataconnect';

// The `GetUserProfile` query requires an argument of type `GetUserProfileVariables`:
const getUserProfileVars: GetUserProfileVariables = {
  id: ..., 
};

// Call the `getUserProfileRef()` function to get a reference to the query.
const ref = getUserProfileRef(getUserProfileVars);
// Variables can be defined inline as well.
const ref = getUserProfileRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserProfileRef(dataConnect, getUserProfileVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `default` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface CreateUserRef {
  ...
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation requires an argument of type `CreateUserVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateUserVariables {
  id: string;
  email: string;
  fullName: string;
  studentId?: string | null;
  facultyReference?: string | null;
  certificateUrl: string;
  gender?: string | null;
}
```
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser, CreateUserVariables } from '@work4abit/dataconnect';

// The `CreateUser` mutation requires an argument of type `CreateUserVariables`:
const createUserVars: CreateUserVariables = {
  id: ..., 
  email: ..., 
  fullName: ..., 
  studentId: ..., // optional
  facultyReference: ..., // optional
  certificateUrl: ..., 
  gender: ..., // optional
};

// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser(createUserVars);
// Variables can be defined inline as well.
const { data } = await createUser({ id: ..., email: ..., fullName: ..., studentId: ..., facultyReference: ..., certificateUrl: ..., gender: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect, createUserVars);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser(createUserVars).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef, CreateUserVariables } from '@work4abit/dataconnect';

// The `CreateUser` mutation requires an argument of type `CreateUserVariables`:
const createUserVars: CreateUserVariables = {
  id: ..., 
  email: ..., 
  fullName: ..., 
  studentId: ..., // optional
  facultyReference: ..., // optional
  certificateUrl: ..., 
  gender: ..., // optional
};

// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef(createUserVars);
// Variables can be defined inline as well.
const ref = createUserRef({ id: ..., email: ..., fullName: ..., studentId: ..., facultyReference: ..., certificateUrl: ..., gender: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect, createUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## UpdateUserStatus
You can execute the `UpdateUserStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
updateUserStatus(vars: UpdateUserStatusVariables): MutationPromise<UpdateUserStatusData, UpdateUserStatusVariables>;

interface UpdateUserStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateUserStatusVariables): MutationRef<UpdateUserStatusData, UpdateUserStatusVariables>;
}
export const updateUserStatusRef: UpdateUserStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateUserStatus(dc: DataConnect, vars: UpdateUserStatusVariables): MutationPromise<UpdateUserStatusData, UpdateUserStatusVariables>;

interface UpdateUserStatusRef {
  ...
  (dc: DataConnect, vars: UpdateUserStatusVariables): MutationRef<UpdateUserStatusData, UpdateUserStatusVariables>;
}
export const updateUserStatusRef: UpdateUserStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateUserStatusRef:
```typescript
const name = updateUserStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateUserStatus` mutation requires an argument of type `UpdateUserStatusVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateUserStatusVariables {
  id: string;
  status: string;
}
```
### Return Type
Recall that executing the `UpdateUserStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateUserStatusData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateUserStatusData {
  user_update?: User_Key | null;
}
```
### Using `UpdateUserStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateUserStatus, UpdateUserStatusVariables } from '@work4abit/dataconnect';

// The `UpdateUserStatus` mutation requires an argument of type `UpdateUserStatusVariables`:
const updateUserStatusVars: UpdateUserStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateUserStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateUserStatus(updateUserStatusVars);
// Variables can be defined inline as well.
const { data } = await updateUserStatus({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateUserStatus(dataConnect, updateUserStatusVars);

console.log(data.user_update);

// Or, you can use the `Promise` API.
updateUserStatus(updateUserStatusVars).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `UpdateUserStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateUserStatusRef, UpdateUserStatusVariables } from '@work4abit/dataconnect';

// The `UpdateUserStatus` mutation requires an argument of type `UpdateUserStatusVariables`:
const updateUserStatusVars: UpdateUserStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateUserStatusRef()` function to get a reference to the mutation.
const ref = updateUserStatusRef(updateUserStatusVars);
// Variables can be defined inline as well.
const ref = updateUserStatusRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateUserStatusRef(dataConnect, updateUserStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

## CreateHelpRequest
You can execute the `CreateHelpRequest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
createHelpRequest(vars: CreateHelpRequestVariables): MutationPromise<CreateHelpRequestData, CreateHelpRequestVariables>;

interface CreateHelpRequestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateHelpRequestVariables): MutationRef<CreateHelpRequestData, CreateHelpRequestVariables>;
}
export const createHelpRequestRef: CreateHelpRequestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createHelpRequest(dc: DataConnect, vars: CreateHelpRequestVariables): MutationPromise<CreateHelpRequestData, CreateHelpRequestVariables>;

interface CreateHelpRequestRef {
  ...
  (dc: DataConnect, vars: CreateHelpRequestVariables): MutationRef<CreateHelpRequestData, CreateHelpRequestVariables>;
}
export const createHelpRequestRef: CreateHelpRequestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createHelpRequestRef:
```typescript
const name = createHelpRequestRef.operationName;
console.log(name);
```

### Variables
The `CreateHelpRequest` mutation requires an argument of type `CreateHelpRequestVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateHelpRequestVariables {
  title: string;
  description: string;
  budget: number;
  requesterId: string;
  category?: string | null;
  urgency?: string | null;
  deadline?: string | null;
}
```
### Return Type
Recall that executing the `CreateHelpRequest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateHelpRequestData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateHelpRequestData {
  helpRequest_insert: HelpRequest_Key;
}
```
### Using `CreateHelpRequest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createHelpRequest, CreateHelpRequestVariables } from '@work4abit/dataconnect';

// The `CreateHelpRequest` mutation requires an argument of type `CreateHelpRequestVariables`:
const createHelpRequestVars: CreateHelpRequestVariables = {
  title: ..., 
  description: ..., 
  budget: ..., 
  requesterId: ..., 
  category: ..., // optional
  urgency: ..., // optional
  deadline: ..., // optional
};

// Call the `createHelpRequest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createHelpRequest(createHelpRequestVars);
// Variables can be defined inline as well.
const { data } = await createHelpRequest({ title: ..., description: ..., budget: ..., requesterId: ..., category: ..., urgency: ..., deadline: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createHelpRequest(dataConnect, createHelpRequestVars);

console.log(data.helpRequest_insert);

// Or, you can use the `Promise` API.
createHelpRequest(createHelpRequestVars).then((response) => {
  const data = response.data;
  console.log(data.helpRequest_insert);
});
```

### Using `CreateHelpRequest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createHelpRequestRef, CreateHelpRequestVariables } from '@work4abit/dataconnect';

// The `CreateHelpRequest` mutation requires an argument of type `CreateHelpRequestVariables`:
const createHelpRequestVars: CreateHelpRequestVariables = {
  title: ..., 
  description: ..., 
  budget: ..., 
  requesterId: ..., 
  category: ..., // optional
  urgency: ..., // optional
  deadline: ..., // optional
};

// Call the `createHelpRequestRef()` function to get a reference to the mutation.
const ref = createHelpRequestRef(createHelpRequestVars);
// Variables can be defined inline as well.
const ref = createHelpRequestRef({ title: ..., description: ..., budget: ..., requesterId: ..., category: ..., urgency: ..., deadline: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createHelpRequestRef(dataConnect, createHelpRequestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.helpRequest_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.helpRequest_insert);
});
```

## CreateApplication
You can execute the `CreateApplication` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
createApplication(vars: CreateApplicationVariables): MutationPromise<CreateApplicationData, CreateApplicationVariables>;

interface CreateApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateApplicationVariables): MutationRef<CreateApplicationData, CreateApplicationVariables>;
}
export const createApplicationRef: CreateApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createApplication(dc: DataConnect, vars: CreateApplicationVariables): MutationPromise<CreateApplicationData, CreateApplicationVariables>;

interface CreateApplicationRef {
  ...
  (dc: DataConnect, vars: CreateApplicationVariables): MutationRef<CreateApplicationData, CreateApplicationVariables>;
}
export const createApplicationRef: CreateApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createApplicationRef:
```typescript
const name = createApplicationRef.operationName;
console.log(name);
```

### Variables
The `CreateApplication` mutation requires an argument of type `CreateApplicationVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateApplicationVariables {
  helpRequestId: UUIDString;
  applicantId: string;
  priceOffer: number;
  message: string;
}
```
### Return Type
Recall that executing the `CreateApplication` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateApplicationData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateApplicationData {
  application_insert: Application_Key;
}
```
### Using `CreateApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createApplication, CreateApplicationVariables } from '@work4abit/dataconnect';

// The `CreateApplication` mutation requires an argument of type `CreateApplicationVariables`:
const createApplicationVars: CreateApplicationVariables = {
  helpRequestId: ..., 
  applicantId: ..., 
  priceOffer: ..., 
  message: ..., 
};

// Call the `createApplication()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createApplication(createApplicationVars);
// Variables can be defined inline as well.
const { data } = await createApplication({ helpRequestId: ..., applicantId: ..., priceOffer: ..., message: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createApplication(dataConnect, createApplicationVars);

console.log(data.application_insert);

// Or, you can use the `Promise` API.
createApplication(createApplicationVars).then((response) => {
  const data = response.data;
  console.log(data.application_insert);
});
```

### Using `CreateApplication`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createApplicationRef, CreateApplicationVariables } from '@work4abit/dataconnect';

// The `CreateApplication` mutation requires an argument of type `CreateApplicationVariables`:
const createApplicationVars: CreateApplicationVariables = {
  helpRequestId: ..., 
  applicantId: ..., 
  priceOffer: ..., 
  message: ..., 
};

// Call the `createApplicationRef()` function to get a reference to the mutation.
const ref = createApplicationRef(createApplicationVars);
// Variables can be defined inline as well.
const ref = createApplicationRef({ helpRequestId: ..., applicantId: ..., priceOffer: ..., message: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createApplicationRef(dataConnect, createApplicationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.application_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.application_insert);
});
```

## UpdateApplicationStatus
You can execute the `UpdateApplicationStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
updateApplicationStatus(vars: UpdateApplicationStatusVariables): MutationPromise<UpdateApplicationStatusData, UpdateApplicationStatusVariables>;

interface UpdateApplicationStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateApplicationStatusVariables): MutationRef<UpdateApplicationStatusData, UpdateApplicationStatusVariables>;
}
export const updateApplicationStatusRef: UpdateApplicationStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateApplicationStatus(dc: DataConnect, vars: UpdateApplicationStatusVariables): MutationPromise<UpdateApplicationStatusData, UpdateApplicationStatusVariables>;

interface UpdateApplicationStatusRef {
  ...
  (dc: DataConnect, vars: UpdateApplicationStatusVariables): MutationRef<UpdateApplicationStatusData, UpdateApplicationStatusVariables>;
}
export const updateApplicationStatusRef: UpdateApplicationStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateApplicationStatusRef:
```typescript
const name = updateApplicationStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateApplicationStatus` mutation requires an argument of type `UpdateApplicationStatusVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateApplicationStatusVariables {
  id: UUIDString;
  status: string;
}
```
### Return Type
Recall that executing the `UpdateApplicationStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateApplicationStatusData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateApplicationStatusData {
  application_update?: Application_Key | null;
}
```
### Using `UpdateApplicationStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateApplicationStatus, UpdateApplicationStatusVariables } from '@work4abit/dataconnect';

// The `UpdateApplicationStatus` mutation requires an argument of type `UpdateApplicationStatusVariables`:
const updateApplicationStatusVars: UpdateApplicationStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateApplicationStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateApplicationStatus(updateApplicationStatusVars);
// Variables can be defined inline as well.
const { data } = await updateApplicationStatus({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateApplicationStatus(dataConnect, updateApplicationStatusVars);

console.log(data.application_update);

// Or, you can use the `Promise` API.
updateApplicationStatus(updateApplicationStatusVars).then((response) => {
  const data = response.data;
  console.log(data.application_update);
});
```

### Using `UpdateApplicationStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateApplicationStatusRef, UpdateApplicationStatusVariables } from '@work4abit/dataconnect';

// The `UpdateApplicationStatus` mutation requires an argument of type `UpdateApplicationStatusVariables`:
const updateApplicationStatusVars: UpdateApplicationStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateApplicationStatusRef()` function to get a reference to the mutation.
const ref = updateApplicationStatusRef(updateApplicationStatusVars);
// Variables can be defined inline as well.
const ref = updateApplicationStatusRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateApplicationStatusRef(dataConnect, updateApplicationStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.application_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.application_update);
});
```

## CreateConversation
You can execute the `CreateConversation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
createConversation(vars: CreateConversationVariables): MutationPromise<CreateConversationData, CreateConversationVariables>;

interface CreateConversationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateConversationVariables): MutationRef<CreateConversationData, CreateConversationVariables>;
}
export const createConversationRef: CreateConversationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createConversation(dc: DataConnect, vars: CreateConversationVariables): MutationPromise<CreateConversationData, CreateConversationVariables>;

interface CreateConversationRef {
  ...
  (dc: DataConnect, vars: CreateConversationVariables): MutationRef<CreateConversationData, CreateConversationVariables>;
}
export const createConversationRef: CreateConversationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createConversationRef:
```typescript
const name = createConversationRef.operationName;
console.log(name);
```

### Variables
The `CreateConversation` mutation requires an argument of type `CreateConversationVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateConversationVariables {
  applicationId: UUIDString;
  posterId: string;
  applicantId: string;
}
```
### Return Type
Recall that executing the `CreateConversation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateConversationData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateConversationData {
  conversation_insert: Conversation_Key;
}
```
### Using `CreateConversation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createConversation, CreateConversationVariables } from '@work4abit/dataconnect';

// The `CreateConversation` mutation requires an argument of type `CreateConversationVariables`:
const createConversationVars: CreateConversationVariables = {
  applicationId: ..., 
  posterId: ..., 
  applicantId: ..., 
};

// Call the `createConversation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createConversation(createConversationVars);
// Variables can be defined inline as well.
const { data } = await createConversation({ applicationId: ..., posterId: ..., applicantId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createConversation(dataConnect, createConversationVars);

console.log(data.conversation_insert);

// Or, you can use the `Promise` API.
createConversation(createConversationVars).then((response) => {
  const data = response.data;
  console.log(data.conversation_insert);
});
```

### Using `CreateConversation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createConversationRef, CreateConversationVariables } from '@work4abit/dataconnect';

// The `CreateConversation` mutation requires an argument of type `CreateConversationVariables`:
const createConversationVars: CreateConversationVariables = {
  applicationId: ..., 
  posterId: ..., 
  applicantId: ..., 
};

// Call the `createConversationRef()` function to get a reference to the mutation.
const ref = createConversationRef(createConversationVars);
// Variables can be defined inline as well.
const ref = createConversationRef({ applicationId: ..., posterId: ..., applicantId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createConversationRef(dataConnect, createConversationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.conversation_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.conversation_insert);
});
```

## UpdateHelpRequestStatus
You can execute the `UpdateHelpRequestStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
updateHelpRequestStatus(vars: UpdateHelpRequestStatusVariables): MutationPromise<UpdateHelpRequestStatusData, UpdateHelpRequestStatusVariables>;

interface UpdateHelpRequestStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateHelpRequestStatusVariables): MutationRef<UpdateHelpRequestStatusData, UpdateHelpRequestStatusVariables>;
}
export const updateHelpRequestStatusRef: UpdateHelpRequestStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateHelpRequestStatus(dc: DataConnect, vars: UpdateHelpRequestStatusVariables): MutationPromise<UpdateHelpRequestStatusData, UpdateHelpRequestStatusVariables>;

interface UpdateHelpRequestStatusRef {
  ...
  (dc: DataConnect, vars: UpdateHelpRequestStatusVariables): MutationRef<UpdateHelpRequestStatusData, UpdateHelpRequestStatusVariables>;
}
export const updateHelpRequestStatusRef: UpdateHelpRequestStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateHelpRequestStatusRef:
```typescript
const name = updateHelpRequestStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateHelpRequestStatus` mutation requires an argument of type `UpdateHelpRequestStatusVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateHelpRequestStatusVariables {
  id: UUIDString;
  status: string;
}
```
### Return Type
Recall that executing the `UpdateHelpRequestStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateHelpRequestStatusData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateHelpRequestStatusData {
  helpRequest_update?: HelpRequest_Key | null;
}
```
### Using `UpdateHelpRequestStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateHelpRequestStatus, UpdateHelpRequestStatusVariables } from '@work4abit/dataconnect';

// The `UpdateHelpRequestStatus` mutation requires an argument of type `UpdateHelpRequestStatusVariables`:
const updateHelpRequestStatusVars: UpdateHelpRequestStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateHelpRequestStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateHelpRequestStatus(updateHelpRequestStatusVars);
// Variables can be defined inline as well.
const { data } = await updateHelpRequestStatus({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateHelpRequestStatus(dataConnect, updateHelpRequestStatusVars);

console.log(data.helpRequest_update);

// Or, you can use the `Promise` API.
updateHelpRequestStatus(updateHelpRequestStatusVars).then((response) => {
  const data = response.data;
  console.log(data.helpRequest_update);
});
```

### Using `UpdateHelpRequestStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateHelpRequestStatusRef, UpdateHelpRequestStatusVariables } from '@work4abit/dataconnect';

// The `UpdateHelpRequestStatus` mutation requires an argument of type `UpdateHelpRequestStatusVariables`:
const updateHelpRequestStatusVars: UpdateHelpRequestStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateHelpRequestStatusRef()` function to get a reference to the mutation.
const ref = updateHelpRequestStatusRef(updateHelpRequestStatusVars);
// Variables can be defined inline as well.
const ref = updateHelpRequestStatusRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateHelpRequestStatusRef(dataConnect, updateHelpRequestStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.helpRequest_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.helpRequest_update);
});
```

## TerminateJob
You can execute the `TerminateJob` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
terminateJob(vars: TerminateJobVariables): MutationPromise<TerminateJobData, TerminateJobVariables>;

interface TerminateJobRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TerminateJobVariables): MutationRef<TerminateJobData, TerminateJobVariables>;
}
export const terminateJobRef: TerminateJobRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
terminateJob(dc: DataConnect, vars: TerminateJobVariables): MutationPromise<TerminateJobData, TerminateJobVariables>;

interface TerminateJobRef {
  ...
  (dc: DataConnect, vars: TerminateJobVariables): MutationRef<TerminateJobData, TerminateJobVariables>;
}
export const terminateJobRef: TerminateJobRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the terminateJobRef:
```typescript
const name = terminateJobRef.operationName;
console.log(name);
```

### Variables
The `TerminateJob` mutation requires an argument of type `TerminateJobVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TerminateJobVariables {
  applicationId: UUIDString;
  helpRequestId: UUIDString;
}
```
### Return Type
Recall that executing the `TerminateJob` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TerminateJobData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface TerminateJobData {
  application_update?: Application_Key | null;
  helpRequest_update?: HelpRequest_Key | null;
}
```
### Using `TerminateJob`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, terminateJob, TerminateJobVariables } from '@work4abit/dataconnect';

// The `TerminateJob` mutation requires an argument of type `TerminateJobVariables`:
const terminateJobVars: TerminateJobVariables = {
  applicationId: ..., 
  helpRequestId: ..., 
};

// Call the `terminateJob()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await terminateJob(terminateJobVars);
// Variables can be defined inline as well.
const { data } = await terminateJob({ applicationId: ..., helpRequestId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await terminateJob(dataConnect, terminateJobVars);

console.log(data.application_update);
console.log(data.helpRequest_update);

// Or, you can use the `Promise` API.
terminateJob(terminateJobVars).then((response) => {
  const data = response.data;
  console.log(data.application_update);
  console.log(data.helpRequest_update);
});
```

### Using `TerminateJob`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, terminateJobRef, TerminateJobVariables } from '@work4abit/dataconnect';

// The `TerminateJob` mutation requires an argument of type `TerminateJobVariables`:
const terminateJobVars: TerminateJobVariables = {
  applicationId: ..., 
  helpRequestId: ..., 
};

// Call the `terminateJobRef()` function to get a reference to the mutation.
const ref = terminateJobRef(terminateJobVars);
// Variables can be defined inline as well.
const ref = terminateJobRef({ applicationId: ..., helpRequestId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = terminateJobRef(dataConnect, terminateJobVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.application_update);
console.log(data.helpRequest_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.application_update);
  console.log(data.helpRequest_update);
});
```

## CompleteJob
You can execute the `CompleteJob` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
completeJob(vars: CompleteJobVariables): MutationPromise<CompleteJobData, CompleteJobVariables>;

interface CompleteJobRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CompleteJobVariables): MutationRef<CompleteJobData, CompleteJobVariables>;
}
export const completeJobRef: CompleteJobRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
completeJob(dc: DataConnect, vars: CompleteJobVariables): MutationPromise<CompleteJobData, CompleteJobVariables>;

interface CompleteJobRef {
  ...
  (dc: DataConnect, vars: CompleteJobVariables): MutationRef<CompleteJobData, CompleteJobVariables>;
}
export const completeJobRef: CompleteJobRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the completeJobRef:
```typescript
const name = completeJobRef.operationName;
console.log(name);
```

### Variables
The `CompleteJob` mutation requires an argument of type `CompleteJobVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CompleteJobVariables {
  applicationId: UUIDString;
  helpRequestId: UUIDString;
}
```
### Return Type
Recall that executing the `CompleteJob` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CompleteJobData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CompleteJobData {
  application_update?: Application_Key | null;
  helpRequest_update?: HelpRequest_Key | null;
}
```
### Using `CompleteJob`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, completeJob, CompleteJobVariables } from '@work4abit/dataconnect';

// The `CompleteJob` mutation requires an argument of type `CompleteJobVariables`:
const completeJobVars: CompleteJobVariables = {
  applicationId: ..., 
  helpRequestId: ..., 
};

// Call the `completeJob()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await completeJob(completeJobVars);
// Variables can be defined inline as well.
const { data } = await completeJob({ applicationId: ..., helpRequestId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await completeJob(dataConnect, completeJobVars);

console.log(data.application_update);
console.log(data.helpRequest_update);

// Or, you can use the `Promise` API.
completeJob(completeJobVars).then((response) => {
  const data = response.data;
  console.log(data.application_update);
  console.log(data.helpRequest_update);
});
```

### Using `CompleteJob`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, completeJobRef, CompleteJobVariables } from '@work4abit/dataconnect';

// The `CompleteJob` mutation requires an argument of type `CompleteJobVariables`:
const completeJobVars: CompleteJobVariables = {
  applicationId: ..., 
  helpRequestId: ..., 
};

// Call the `completeJobRef()` function to get a reference to the mutation.
const ref = completeJobRef(completeJobVars);
// Variables can be defined inline as well.
const ref = completeJobRef({ applicationId: ..., helpRequestId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = completeJobRef(dataConnect, completeJobVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.application_update);
console.log(data.helpRequest_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.application_update);
  console.log(data.helpRequest_update);
});
```

## DeleteUser
You can execute the `DeleteUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
deleteUser(vars: DeleteUserVariables): MutationPromise<DeleteUserData, DeleteUserVariables>;

interface DeleteUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteUserVariables): MutationRef<DeleteUserData, DeleteUserVariables>;
}
export const deleteUserRef: DeleteUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteUser(dc: DataConnect, vars: DeleteUserVariables): MutationPromise<DeleteUserData, DeleteUserVariables>;

interface DeleteUserRef {
  ...
  (dc: DataConnect, vars: DeleteUserVariables): MutationRef<DeleteUserData, DeleteUserVariables>;
}
export const deleteUserRef: DeleteUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteUserRef:
```typescript
const name = deleteUserRef.operationName;
console.log(name);
```

### Variables
The `DeleteUser` mutation requires an argument of type `DeleteUserVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteUserVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteUserData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteUserData {
  user_delete?: User_Key | null;
}
```
### Using `DeleteUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteUser, DeleteUserVariables } from '@work4abit/dataconnect';

// The `DeleteUser` mutation requires an argument of type `DeleteUserVariables`:
const deleteUserVars: DeleteUserVariables = {
  id: ..., 
};

// Call the `deleteUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteUser(deleteUserVars);
// Variables can be defined inline as well.
const { data } = await deleteUser({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteUser(dataConnect, deleteUserVars);

console.log(data.user_delete);

// Or, you can use the `Promise` API.
deleteUser(deleteUserVars).then((response) => {
  const data = response.data;
  console.log(data.user_delete);
});
```

### Using `DeleteUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteUserRef, DeleteUserVariables } from '@work4abit/dataconnect';

// The `DeleteUser` mutation requires an argument of type `DeleteUserVariables`:
const deleteUserVars: DeleteUserVariables = {
  id: ..., 
};

// Call the `deleteUserRef()` function to get a reference to the mutation.
const ref = deleteUserRef(deleteUserVars);
// Variables can be defined inline as well.
const ref = deleteUserRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteUserRef(dataConnect, deleteUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_delete);
});
```

## DeleteApplication
You can execute the `DeleteApplication` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
deleteApplication(vars: DeleteApplicationVariables): MutationPromise<DeleteApplicationData, DeleteApplicationVariables>;

interface DeleteApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteApplicationVariables): MutationRef<DeleteApplicationData, DeleteApplicationVariables>;
}
export const deleteApplicationRef: DeleteApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteApplication(dc: DataConnect, vars: DeleteApplicationVariables): MutationPromise<DeleteApplicationData, DeleteApplicationVariables>;

interface DeleteApplicationRef {
  ...
  (dc: DataConnect, vars: DeleteApplicationVariables): MutationRef<DeleteApplicationData, DeleteApplicationVariables>;
}
export const deleteApplicationRef: DeleteApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteApplicationRef:
```typescript
const name = deleteApplicationRef.operationName;
console.log(name);
```

### Variables
The `DeleteApplication` mutation requires an argument of type `DeleteApplicationVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteApplicationVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteApplication` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteApplicationData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteApplicationData {
  application_delete?: Application_Key | null;
}
```
### Using `DeleteApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteApplication, DeleteApplicationVariables } from '@work4abit/dataconnect';

// The `DeleteApplication` mutation requires an argument of type `DeleteApplicationVariables`:
const deleteApplicationVars: DeleteApplicationVariables = {
  id: ..., 
};

// Call the `deleteApplication()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteApplication(deleteApplicationVars);
// Variables can be defined inline as well.
const { data } = await deleteApplication({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteApplication(dataConnect, deleteApplicationVars);

console.log(data.application_delete);

// Or, you can use the `Promise` API.
deleteApplication(deleteApplicationVars).then((response) => {
  const data = response.data;
  console.log(data.application_delete);
});
```

### Using `DeleteApplication`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteApplicationRef, DeleteApplicationVariables } from '@work4abit/dataconnect';

// The `DeleteApplication` mutation requires an argument of type `DeleteApplicationVariables`:
const deleteApplicationVars: DeleteApplicationVariables = {
  id: ..., 
};

// Call the `deleteApplicationRef()` function to get a reference to the mutation.
const ref = deleteApplicationRef(deleteApplicationVars);
// Variables can be defined inline as well.
const ref = deleteApplicationRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteApplicationRef(dataConnect, deleteApplicationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.application_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.application_delete);
});
```

