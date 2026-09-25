# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUser, updateUserStatus, createHelpRequest, createApplication, updateApplicationStatus, createConversation, updateHelpRequestStatus, terminateJob, completeJob, deleteUser } from '@work4abit/dataconnect';


// Operation CreateUser:  For variables, look at type CreateUserVars in ../index.d.ts
const { data } = await CreateUser(dataConnect, createUserVars);

// Operation UpdateUserStatus:  For variables, look at type UpdateUserStatusVars in ../index.d.ts
const { data } = await UpdateUserStatus(dataConnect, updateUserStatusVars);

// Operation CreateHelpRequest:  For variables, look at type CreateHelpRequestVars in ../index.d.ts
const { data } = await CreateHelpRequest(dataConnect, createHelpRequestVars);

// Operation CreateApplication:  For variables, look at type CreateApplicationVars in ../index.d.ts
const { data } = await CreateApplication(dataConnect, createApplicationVars);

// Operation UpdateApplicationStatus:  For variables, look at type UpdateApplicationStatusVars in ../index.d.ts
const { data } = await UpdateApplicationStatus(dataConnect, updateApplicationStatusVars);

// Operation CreateConversation:  For variables, look at type CreateConversationVars in ../index.d.ts
const { data } = await CreateConversation(dataConnect, createConversationVars);

// Operation UpdateHelpRequestStatus:  For variables, look at type UpdateHelpRequestStatusVars in ../index.d.ts
const { data } = await UpdateHelpRequestStatus(dataConnect, updateHelpRequestStatusVars);

// Operation TerminateJob:  For variables, look at type TerminateJobVars in ../index.d.ts
const { data } = await TerminateJob(dataConnect, terminateJobVars);

// Operation CompleteJob:  For variables, look at type CompleteJobVars in ../index.d.ts
const { data } = await CompleteJob(dataConnect, completeJobVars);

// Operation DeleteUser:  For variables, look at type DeleteUserVars in ../index.d.ts
const { data } = await DeleteUser(dataConnect, deleteUserVars);


```