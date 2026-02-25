/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { IMAGE_SIZE, PADDING } from '../tools/constants';
import useColors from '../hooks/useColors';
import homeStyles from '../screens/style';

const EmptyListComponent = ({ iconName, title, description }) => {
    // =============== Colors ===============
    const COLORS = useColors();

    return (
        <View style={{ flex: 1, height: Dimensions.get('window').height - 400, justifyContent: 'center' }}>
            <View style={[homeStyles.workTop, { flexDirection: 'column', marginBottom: PADDING.p01, paddingHorizontal: PADDING.p05 }]}>
                {iconName &&
                    <Icon name={iconName} size={IMAGE_SIZE.s20} color={COLORS.black} />
                }
                {title &&
                    <Text style={[homeStyles.cardEmptyTitle, { color: COLORS.link_color, marginVertical: PADDING.p03 }]}>{title}</Text>
                }
                {description &&
                    <Text style={[homeStyles.cardEmptyText, { color: COLORS.black, marginBottom: PADDING.p03 }]}>{description}</Text>
                }
            </View>
        </View>
    );
};

export default EmptyListComponent;