import data from './institute_list_full_252.json';
export const institutes = data.institutes;
export const instituteNames = data.institutes.map(i => i.name);
export default instituteNames;

