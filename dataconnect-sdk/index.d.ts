import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Application_Key {
  id: UUIDString;
  __typename?: 'Application_Key';
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface CompleteJobData {
  application_update?: Application_Key | null;
  helpRequest_update?: HelpRequest_Key | null;
}

export interface CompleteJobVariables {
  applicationId: UUIDString;
  helpRequestId: UUIDString;
}

export interface Conversation_Key {
  id: UUIDString;
  __typename?: 'Conversation_Key';
}

export interface CreateApplicationData {
  application_insert: Application_Key;
}

export interface CreateApplicationVariables {
  helpRequestId: UUIDString;
  applicantId: string;
  priceOffer: number;
  message: string;
}

export interface CreateConversationData {
  conversation_insert: Conversation_Key;
}

export interface CreateConversationVariables {
  applicationId: UUIDString;
  posterId: string;
  applicantId: string;
}

export interface CreateHelpRequestData {
  helpRequest_insert: HelpRequest_Key;
}

export interface CreateHelpRequestVariables {
  title: string;
  description: string;
  budget: number;
  requesterId: string;
  category?: string | null;
  urgency?: string | null;
  deadline?: string | null;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface CreateUserVariables {
  id: string;
  email: string;
  fullName: string;
  studentId?: string | null;
  facultyReference?: string | null;
  certificateUrl: string;
  gender?: string | null;
}

export interface DeleteApplicationData {
  application_delete?: Application_Key | null;
}

export interface DeleteApplicationVariables {
  id: UUIDString;
}

export interface DeleteUserData {
  user_delete?: User_Key | null;
}

export interface DeleteUserVariables {
  id: string;
}

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

export interface GetUserProfileVariables {
  id: string;
}

export interface GetUserVariables {
  id: string;
}

export interface HelpRequest_Key {
  id: UUIDString;
  __typename?: 'HelpRequest_Key';
}

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

export interface ListApplicationsByApplicantVariables {
  userId: string;
}

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

export interface ListApplicationsForMyRequestsVariables {
  userId: string;
}

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

export interface ListConversationsVariables {
  userId: string;
}

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

export interface ListMyHelpRequestsWithApplicationsVariables {
  userId: string;
}

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

export interface Service_Key {
  id: UUIDString;
  __typename?: 'Service_Key';
}

export interface TerminateJobData {
  application_update?: Application_Key | null;
  helpRequest_update?: HelpRequest_Key | null;
}

export interface TerminateJobVariables {
  applicationId: UUIDString;
  helpRequestId: UUIDString;
}

export interface UpdateApplicationStatusData {
  application_update?: Application_Key | null;
}

export interface UpdateApplicationStatusVariables {
  id: UUIDString;
  status: string;
}

export interface UpdateHelpRequestStatusData {
  helpRequest_update?: HelpRequest_Key | null;
}

export interface UpdateHelpRequestStatusVariables {
  id: UUIDString;
  status: string;
}

export interface UpdateUserStatusData {
  user_update?: User_Key | null;
}

export interface UpdateUserStatusVariables {
  id: string;
  status: string;
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;
export function createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface UpdateUserStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateUserStatusVariables): MutationRef<UpdateUserStatusData, UpdateUserStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateUserStatusVariables): MutationRef<UpdateUserStatusData, UpdateUserStatusVariables>;
  operationName: string;
}
export const updateUserStatusRef: UpdateUserStatusRef;

export function updateUserStatus(vars: UpdateUserStatusVariables): MutationPromise<UpdateUserStatusData, UpdateUserStatusVariables>;
export function updateUserStatus(dc: DataConnect, vars: UpdateUserStatusVariables): MutationPromise<UpdateUserStatusData, UpdateUserStatusVariables>;

interface CreateHelpRequestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateHelpRequestVariables): MutationRef<CreateHelpRequestData, CreateHelpRequestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateHelpRequestVariables): MutationRef<CreateHelpRequestData, CreateHelpRequestVariables>;
  operationName: string;
}
export const createHelpRequestRef: CreateHelpRequestRef;

export function createHelpRequest(vars: CreateHelpRequestVariables): MutationPromise<CreateHelpRequestData, CreateHelpRequestVariables>;
export function createHelpRequest(dc: DataConnect, vars: CreateHelpRequestVariables): MutationPromise<CreateHelpRequestData, CreateHelpRequestVariables>;

interface CreateApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateApplicationVariables): MutationRef<CreateApplicationData, CreateApplicationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateApplicationVariables): MutationRef<CreateApplicationData, CreateApplicationVariables>;
  operationName: string;
}
export const createApplicationRef: CreateApplicationRef;

export function createApplication(vars: CreateApplicationVariables): MutationPromise<CreateApplicationData, CreateApplicationVariables>;
export function createApplication(dc: DataConnect, vars: CreateApplicationVariables): MutationPromise<CreateApplicationData, CreateApplicationVariables>;

interface UpdateApplicationStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateApplicationStatusVariables): MutationRef<UpdateApplicationStatusData, UpdateApplicationStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateApplicationStatusVariables): MutationRef<UpdateApplicationStatusData, UpdateApplicationStatusVariables>;
  operationName: string;
}
export const updateApplicationStatusRef: UpdateApplicationStatusRef;

export function updateApplicationStatus(vars: UpdateApplicationStatusVariables): MutationPromise<UpdateApplicationStatusData, UpdateApplicationStatusVariables>;
export function updateApplicationStatus(dc: DataConnect, vars: UpdateApplicationStatusVariables): MutationPromise<UpdateApplicationStatusData, UpdateApplicationStatusVariables>;

interface CreateConversationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateConversationVariables): MutationRef<CreateConversationData, CreateConversationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateConversationVariables): MutationRef<CreateConversationData, CreateConversationVariables>;
  operationName: string;
}
export const createConversationRef: CreateConversationRef;

export function createConversation(vars: CreateConversationVariables): MutationPromise<CreateConversationData, CreateConversationVariables>;
export function createConversation(dc: DataConnect, vars: CreateConversationVariables): MutationPromise<CreateConversationData, CreateConversationVariables>;

interface UpdateHelpRequestStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateHelpRequestStatusVariables): MutationRef<UpdateHelpRequestStatusData, UpdateHelpRequestStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateHelpRequestStatusVariables): MutationRef<UpdateHelpRequestStatusData, UpdateHelpRequestStatusVariables>;
  operationName: string;
}
export const updateHelpRequestStatusRef: UpdateHelpRequestStatusRef;

export function updateHelpRequestStatus(vars: UpdateHelpRequestStatusVariables): MutationPromise<UpdateHelpRequestStatusData, UpdateHelpRequestStatusVariables>;
export function updateHelpRequestStatus(dc: DataConnect, vars: UpdateHelpRequestStatusVariables): MutationPromise<UpdateHelpRequestStatusData, UpdateHelpRequestStatusVariables>;

interface TerminateJobRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TerminateJobVariables): MutationRef<TerminateJobData, TerminateJobVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TerminateJobVariables): MutationRef<TerminateJobData, TerminateJobVariables>;
  operationName: string;
}
export const terminateJobRef: TerminateJobRef;

export function terminateJob(vars: TerminateJobVariables): MutationPromise<TerminateJobData, TerminateJobVariables>;
export function terminateJob(dc: DataConnect, vars: TerminateJobVariables): MutationPromise<TerminateJobData, TerminateJobVariables>;

interface CompleteJobRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CompleteJobVariables): MutationRef<CompleteJobData, CompleteJobVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CompleteJobVariables): MutationRef<CompleteJobData, CompleteJobVariables>;
  operationName: string;
}
export const completeJobRef: CompleteJobRef;

export function completeJob(vars: CompleteJobVariables): MutationPromise<CompleteJobData, CompleteJobVariables>;
export function completeJob(dc: DataConnect, vars: CompleteJobVariables): MutationPromise<CompleteJobData, CompleteJobVariables>;

interface DeleteUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteUserVariables): MutationRef<DeleteUserData, DeleteUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteUserVariables): MutationRef<DeleteUserData, DeleteUserVariables>;
  operationName: string;
}
export const deleteUserRef: DeleteUserRef;

export function deleteUser(vars: DeleteUserVariables): MutationPromise<DeleteUserData, DeleteUserVariables>;
export function deleteUser(dc: DataConnect, vars: DeleteUserVariables): MutationPromise<DeleteUserData, DeleteUserVariables>;

interface DeleteApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteApplicationVariables): MutationRef<DeleteApplicationData, DeleteApplicationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteApplicationVariables): MutationRef<DeleteApplicationData, DeleteApplicationVariables>;
  operationName: string;
}
export const deleteApplicationRef: DeleteApplicationRef;

export function deleteApplication(vars: DeleteApplicationVariables): MutationPromise<DeleteApplicationData, DeleteApplicationVariables>;
export function deleteApplication(dc: DataConnect, vars: DeleteApplicationVariables): MutationPromise<DeleteApplicationData, DeleteApplicationVariables>;

interface ListPendingUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPendingUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPendingUsersData, undefined>;
  operationName: string;
}
export const listPendingUsersRef: ListPendingUsersRef;

export function listPendingUsers(options?: ExecuteQueryOptions): QueryPromise<ListPendingUsersData, undefined>;
export function listPendingUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPendingUsersData, undefined>;

interface GetUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserVariables): QueryRef<GetUserData, GetUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserVariables): QueryRef<GetUserData, GetUserVariables>;
  operationName: string;
}
export const getUserRef: GetUserRef;

export function getUser(vars: GetUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserData, GetUserVariables>;
export function getUser(dc: DataConnect, vars: GetUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserData, GetUserVariables>;

interface ListHelpRequestsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListHelpRequestsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListHelpRequestsData, undefined>;
  operationName: string;
}
export const listHelpRequestsRef: ListHelpRequestsRef;

export function listHelpRequests(options?: ExecuteQueryOptions): QueryPromise<ListHelpRequestsData, undefined>;
export function listHelpRequests(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListHelpRequestsData, undefined>;

interface ListApplicationsByApplicantRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListApplicationsByApplicantVariables): QueryRef<ListApplicationsByApplicantData, ListApplicationsByApplicantVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListApplicationsByApplicantVariables): QueryRef<ListApplicationsByApplicantData, ListApplicationsByApplicantVariables>;
  operationName: string;
}
export const listApplicationsByApplicantRef: ListApplicationsByApplicantRef;

export function listApplicationsByApplicant(vars: ListApplicationsByApplicantVariables, options?: ExecuteQueryOptions): QueryPromise<ListApplicationsByApplicantData, ListApplicationsByApplicantVariables>;
export function listApplicationsByApplicant(dc: DataConnect, vars: ListApplicationsByApplicantVariables, options?: ExecuteQueryOptions): QueryPromise<ListApplicationsByApplicantData, ListApplicationsByApplicantVariables>;

interface ListApplicationsForMyRequestsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListApplicationsForMyRequestsVariables): QueryRef<ListApplicationsForMyRequestsData, ListApplicationsForMyRequestsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListApplicationsForMyRequestsVariables): QueryRef<ListApplicationsForMyRequestsData, ListApplicationsForMyRequestsVariables>;
  operationName: string;
}
export const listApplicationsForMyRequestsRef: ListApplicationsForMyRequestsRef;

export function listApplicationsForMyRequests(vars: ListApplicationsForMyRequestsVariables, options?: ExecuteQueryOptions): QueryPromise<ListApplicationsForMyRequestsData, ListApplicationsForMyRequestsVariables>;
export function listApplicationsForMyRequests(dc: DataConnect, vars: ListApplicationsForMyRequestsVariables, options?: ExecuteQueryOptions): QueryPromise<ListApplicationsForMyRequestsData, ListApplicationsForMyRequestsVariables>;

interface ListMyHelpRequestsWithApplicationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMyHelpRequestsWithApplicationsVariables): QueryRef<ListMyHelpRequestsWithApplicationsData, ListMyHelpRequestsWithApplicationsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListMyHelpRequestsWithApplicationsVariables): QueryRef<ListMyHelpRequestsWithApplicationsData, ListMyHelpRequestsWithApplicationsVariables>;
  operationName: string;
}
export const listMyHelpRequestsWithApplicationsRef: ListMyHelpRequestsWithApplicationsRef;

export function listMyHelpRequestsWithApplications(vars: ListMyHelpRequestsWithApplicationsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyHelpRequestsWithApplicationsData, ListMyHelpRequestsWithApplicationsVariables>;
export function listMyHelpRequestsWithApplications(dc: DataConnect, vars: ListMyHelpRequestsWithApplicationsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyHelpRequestsWithApplicationsData, ListMyHelpRequestsWithApplicationsVariables>;

interface ListConversationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListConversationsVariables): QueryRef<ListConversationsData, ListConversationsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListConversationsVariables): QueryRef<ListConversationsData, ListConversationsVariables>;
  operationName: string;
}
export const listConversationsRef: ListConversationsRef;

export function listConversations(vars: ListConversationsVariables, options?: ExecuteQueryOptions): QueryPromise<ListConversationsData, ListConversationsVariables>;
export function listConversations(dc: DataConnect, vars: ListConversationsVariables, options?: ExecuteQueryOptions): QueryPromise<ListConversationsData, ListConversationsVariables>;

interface ListAllUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllUsersData, undefined>;
  operationName: string;
}
export const listAllUsersRef: ListAllUsersRef;

export function listAllUsers(options?: ExecuteQueryOptions): QueryPromise<ListAllUsersData, undefined>;
export function listAllUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAllUsersData, undefined>;

interface ListAllHelpRequestsAdminRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllHelpRequestsAdminData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllHelpRequestsAdminData, undefined>;
  operationName: string;
}
export const listAllHelpRequestsAdminRef: ListAllHelpRequestsAdminRef;

export function listAllHelpRequestsAdmin(options?: ExecuteQueryOptions): QueryPromise<ListAllHelpRequestsAdminData, undefined>;
export function listAllHelpRequestsAdmin(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAllHelpRequestsAdminData, undefined>;

interface ListAllApplicationsAdminRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllApplicationsAdminData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllApplicationsAdminData, undefined>;
  operationName: string;
}
export const listAllApplicationsAdminRef: ListAllApplicationsAdminRef;

export function listAllApplicationsAdmin(options?: ExecuteQueryOptions): QueryPromise<ListAllApplicationsAdminData, undefined>;
export function listAllApplicationsAdmin(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAllApplicationsAdminData, undefined>;

interface GetUserProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserProfileVariables): QueryRef<GetUserProfileData, GetUserProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserProfileVariables): QueryRef<GetUserProfileData, GetUserProfileVariables>;
  operationName: string;
}
export const getUserProfileRef: GetUserProfileRef;

export function getUserProfile(vars: GetUserProfileVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserProfileData, GetUserProfileVariables>;
export function getUserProfile(dc: DataConnect, vars: GetUserProfileVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserProfileData, GetUserProfileVariables>;

