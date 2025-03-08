import { Layout } from '@/core/Layout';
import logoPic from '@/resources/42_logo.svg';
import avatarPic from '@/resources/avatar.png';

const AuthLayout = new Layout({
  name: 'AuthLayout',
  beforeMounted: async () => {
    console.log('AuthLayout beforeMounted');
  },
});

export default AuthLayout;
