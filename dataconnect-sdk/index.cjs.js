const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'work4abit-service',
  location: 'asia-southeast1'
};
exports.connectorConfig = connectorConfig;

const createUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser', inputVars);
}
createUserRef.operationName = 'CreateUser';
exports.createUserRef = createUserRef;

exports.createUser = function createUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createUserRef(dcInstance, inputVars));
}
;

const updateUserStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateUserStatus', inputVars);
}
updateUserStatusRef.operationName = 'UpdateUserStatus';
exports.updateUserStatusRef = updateUserStatusRef;

exports.updateUserStatus = function updateUserStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateUserStatusRef(dcInstance, inputVars));
}
;

const createHelpRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateHelpRequest', inputVars);
}
createHelpRequestRef.operationName = 'CreateHelpRequest';
exports.createHelpRequestRef = createHelpRequestRef;

exports.createHelpRequest = function createHelpRequest(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createHelpRequestRef(dcInstance, inputVars));
}
;

const createApplicationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateApplication', inputVars);
}
createApplicationRef.operationName = 'CreateApplication';
exports.createApplicationRef = createApplicationRef;

exports.createApplication = function createApplication(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createApplicationRef(dcInstance, inputVars));
}
;

const updateApplicationStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateApplicationStatus', inputVars);
}
updateApplicationStatusRef.operationName = 'UpdateApplicationStatus';
exports.updateApplicationStatusRef = updateApplicationStatusRef;

exports.updateApplicationStatus = function updateApplicationStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateApplicationStatusRef(dcInstance, inputVars));
}
;

const createConversationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateConversation', inputVars);
}
createConversationRef.operationName = 'CreateConversation';
exports.createConversationRef = createConversationRef;

exports.createConversation = function createConversation(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createConversationRef(dcInstance, inputVars));
}
;

const updateHelpRequestStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateHelpRequestStatus', inputVars);
}
updateHelpRequestStatusRef.operationName = 'UpdateHelpRequestStatus';
exports.updateHelpRequestStatusRef = updateHelpRequestStatusRef;

exports.updateHelpRequestStatus = function updateHelpRequestStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateHelpRequestStatusRef(dcInstance, inputVars));
}
;

const terminateJobRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'TerminateJob', inputVars);
}
terminateJobRef.operationName = 'TerminateJob';
exports.terminateJobRef = terminateJobRef;

exports.terminateJob = function terminateJob(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(terminateJobRef(dcInstance, inputVars));
}
;

const completeJobRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CompleteJob', inputVars);
}
completeJobRef.operationName = 'CompleteJob';
exports.completeJobRef = completeJobRef;

exports.completeJob = function completeJob(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(completeJobRef(dcInstance, inputVars));
}
;

const deleteUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteUser', inputVars);
}
deleteUserRef.operationName = 'DeleteUser';
exports.deleteUserRef = deleteUserRef;

exports.deleteUser = function deleteUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteUserRef(dcInstance, inputVars));
}
;

const deleteApplicationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteApplication', inputVars);
}
deleteApplicationRef.operationName = 'DeleteApplication';
exports.deleteApplicationRef = deleteApplicationRef;

exports.deleteApplication = function deleteApplication(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteApplicationRef(dcInstance, inputVars));
}
;

const listPendingUsersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPendingUsers');
}
listPendingUsersRef.operationName = 'ListPendingUsers';
exports.listPendingUsersRef = listPendingUsersRef;

exports.listPendingUsers = function listPendingUsers(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listPendingUsersRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUser', inputVars);
}
getUserRef.operationName = 'GetUser';
exports.getUserRef = getUserRef;

exports.getUser = function getUser(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getUserRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listHelpRequestsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListHelpRequests');
}
listHelpRequestsRef.operationName = 'ListHelpRequests';
exports.listHelpRequestsRef = listHelpRequestsRef;

exports.listHelpRequests = function listHelpRequests(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listHelpRequestsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listApplicationsByApplicantRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListApplicationsByApplicant', inputVars);
}
listApplicationsByApplicantRef.operationName = 'ListApplicationsByApplicant';
exports.listApplicationsByApplicantRef = listApplicationsByApplicantRef;

exports.listApplicationsByApplicant = function listApplicationsByApplicant(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listApplicationsByApplicantRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listApplicationsForMyRequestsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListApplicationsForMyRequests', inputVars);
}
listApplicationsForMyRequestsRef.operationName = 'ListApplicationsForMyRequests';
exports.listApplicationsForMyRequestsRef = listApplicationsForMyRequestsRef;

exports.listApplicationsForMyRequests = function listApplicationsForMyRequests(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listApplicationsForMyRequestsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listMyHelpRequestsWithApplicationsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyHelpRequestsWithApplications', inputVars);
}
listMyHelpRequestsWithApplicationsRef.operationName = 'ListMyHelpRequestsWithApplications';
exports.listMyHelpRequestsWithApplicationsRef = listMyHelpRequestsWithApplicationsRef;

exports.listMyHelpRequestsWithApplications = function listMyHelpRequestsWithApplications(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listMyHelpRequestsWithApplicationsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listConversationsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListConversations', inputVars);
}
listConversationsRef.operationName = 'ListConversations';
exports.listConversationsRef = listConversationsRef;

exports.listConversations = function listConversations(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listConversationsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listAllUsersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllUsers');
}
listAllUsersRef.operationName = 'ListAllUsers';
exports.listAllUsersRef = listAllUsersRef;

exports.listAllUsers = function listAllUsers(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listAllUsersRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listAllHelpRequestsAdminRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllHelpRequestsAdmin');
}
listAllHelpRequestsAdminRef.operationName = 'ListAllHelpRequestsAdmin';
exports.listAllHelpRequestsAdminRef = listAllHelpRequestsAdminRef;

exports.listAllHelpRequestsAdmin = function listAllHelpRequestsAdmin(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listAllHelpRequestsAdminRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listAllApplicationsAdminRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllApplicationsAdmin');
}
listAllApplicationsAdminRef.operationName = 'ListAllApplicationsAdmin';
exports.listAllApplicationsAdminRef = listAllApplicationsAdminRef;

exports.listAllApplicationsAdmin = function listAllApplicationsAdmin(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listAllApplicationsAdminRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getUserProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserProfile', inputVars);
}
getUserProfileRef.operationName = 'GetUserProfile';
exports.getUserProfileRef = getUserProfileRef;

exports.getUserProfile = function getUserProfile(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getUserProfileRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
