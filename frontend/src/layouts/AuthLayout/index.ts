import { Layout } from '@/core/Layout';
import { checkAuthentication } from '@/libs/Auth/currentUser';
import { IBeforeMountRes } from '@/main';

const AuthLayout = new Layout({
  name: 'AuthLayout',
  beforeMounted: async (): Promise<IBeforeMountRes> => {
    return { user: await checkAuthentication() };
  },
});

export default AuthLayout;
