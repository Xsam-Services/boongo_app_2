import React from 'react';

import OrganizationListScreen from './OrganizationListScreen';

const GovernmentScreen = () => <OrganizationListScreen typeId={35} navigationTitle="navigation.government.title" detailType="government" addRoute="AddGovernment" emptyIcon="city-variant-outline" />;

export default GovernmentScreen;
