export const filterConf = [
  {
    name: 'producer',
    displayName: 'organization_name',
    text: 'Source :',
    values: [],
    toFilterParam: (elem) => {
      return { 'producer.organization_name': `"${elem.producer.organization_name}"` };
    },
  },
  {
    name: 'theme',
    text: 'Theme :',
    values: [],
    toFilterParam: (elem) => {
      return { theme: `"${elem.theme}"` };
    },
  },
  {
    name: 'resource_languages',
    text: 'Language :',
    values: [],
    toFilterParam: (elem) => {
      return { resource_languages: `"${elem.resource_languages}"` };
    },
  },
];
