import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { HomeStackNavigation } from "./HomeStackNavigation";

const Drawer = createDrawerNavigator();

export const DrawerNavigation = () => {
    const { userInfo } = useContext(AuthContext);

    const restricted = [4, 5, 29].includes(userInfo?.status?.id);

    return (
        <Drawer.Navigator swipeEnabled={!restricted} drawerContent={props => <DrawerContent {...props} />} screenOptions={{ headerShown: false }}>
            <Drawer.Screen name='Home' component={HomeStackNavigation} />
        </Drawer.Navigator>
    );
};