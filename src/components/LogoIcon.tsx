import Icon, { IconProps } from '@mui/material/Icon';
import { useIntl } from 'react-intl';
import { MessageID } from '../i18n/messages';
import logo from '../logo.svg';

/** An icon that shows the BBDT logo. */
const LogoIcon: React.FC<IconProps> = (props) => {
    const intl = useIntl();

    return <Icon
        component="img"
        src={logo}
        alt={intl.formatMessage({ id: MessageID.logoAlt })}
        {...props}
    />;
};

export default LogoIcon;
