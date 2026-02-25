/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useEffect, useRef, useState } from 'react';
import { Text, useWindowDimensions, Animated } from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';
import { TEXT_SIZE } from '../../tools/constants';
import homeStyles from '../style';
import useColors from '../../hooks/useColors';

const CustomTabs = ({ routes, newsData, booksData, tabBarHeight, headerHeight, scrollY, topInset }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Get data ===============
  const [tabIndex, setTabIndex] = useState(0);
  const layout = useWindowDimensions();
  let listRefArr = useRef([]);
  let scrollOffset = useRef({});
  let isListGliding = useRef(false);

  useEffect(() => {
    scrollY.addListener(({ value }) => {
      const currentRoute = routes[tabIndex].key;

      scrollOffset.current[currentRoute] = value;
    });

    return () => {
      scrollY.removeAllListeners();
    };
  }, [routes, tabIndex])

  const syncScrollOffset = () => {
    const currentRouteKey = routes[tabIndex].key;

    listRefArr.current.forEach(item => {
      if (item.key !== currentRouteKey) {
        if (scrollY._value < headerHeight && scrollY._value >= 0) {
          if (item.value) {
            item.value.scrollToOffset({
              offset: scrollY._value,
              animated: false
            });

            scrollOffset.current[item.key] = scrollY._value;
          }

        } else if (scrollY._value >= headerHeight) {
          if (scrollOffset.current[item.key] < headerHeight || scrollOffset.current[item.key] == null) {
            if (item.value) {
              item.value.scrollToOffset({
                offset: headerHeight,
                animated: false
              });

              scrollOffset.current[item.key] = headerHeight;
            }
          }
        }
      }
    });
  };

  const onMomentumScrollBegin = () => {
    isListGliding.current = true;
  };

  const onMomentumScrollEnd = () => {
    isListGliding.current = false;
    syncScrollOffset();
  };

  const onScrollEndDrag = () => {
    syncScrollOffset();
  };

  const renderTabOne = ({ item, index }) => {
    return <TabItem item={item} />
  };

  const renderTabTwo = ({ item, index }) => {
    return <TabItem item={item} />
  };

  const renderScene = ({ route }) => {
    let data;
    let renderItem;

    switch (route.key) {
      case 'tab1':
        data = newsData;
        renderItem = renderTabOne
        break;

      case 'tab2':
        data = booksData;
        renderItem = renderTabTwo
        break;

      default:
        return null
    }

    return (
      <Scene
        data={data}
        renderItem={renderItem}
        headerHeight={headerHeight}
        tabBarHeight={tabBarHeight}
        scrollY={scrollY}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollRef={ref => {
          if (ref) {
            const found = listRefArr.current.find(e => e.key === route.key);

            if (!found) {
              listRefArr.current.push({
                key: route.key,
                value: ref,
              });
            }
          }
        }}
      />
    );
  };

  const renderLabel = ({ route, focused }) => {
    <Text style={{ fontSize: TEXT_SIZE.normal, fontWeight: '300', color: COLORS.black, opacity: (focused ? 1 : 0.5) }}>{route.title}</Text>
  };

  const renderTabBar = props => {
    <Animated.View
      style={[homeStyles.tabBar,
      {
        transform: [{
          translateY: scrollY.interpolate({
            inputRange: [0, headerHeight],
            outputRange: [headerHeight, topInset],
            extrapolate: 'clamp'
          })
        }]
      }]}>
      <TabBar
        {...props}
        style={{ backgroundColor: COLORS.white }}
        renderLabel={renderLabel}
        indicatorStyle={{ backgroundColor: COLORS.warning }} />
    </Animated.View>
  };

  return (
    <TabView
      onIndexChange={index => setTabIndex(index)}
      navigationState={{ index: tabIndex, routes }}
      renderScene={renderScene}
      renderTabBar={renderTabBar}
      initialLayout={{ width: layout.width }} />
  );
};

export default CustomTabs;