import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectIsManagerOrLead } from '@/store/selectors/authSelectors';
import LeaderHome from './LeaderHome';
import MemberHome from './MemberHome';

const RoleHome: React.FC = () => {
  const isLeader = useAppSelector(selectIsManagerOrLead);
  return isLeader ? <LeaderHome /> : <MemberHome />;
};

export default RoleHome;
