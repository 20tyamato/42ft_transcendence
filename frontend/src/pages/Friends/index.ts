import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';

const FriendsPage = new Page({
    name: 'Friends',
    config: {
      layout: CommonLayout,
    },
    mounted: async () => {
      checkUserAccess();
    },
  });
  
  export default FriendsPage;
  