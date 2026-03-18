import { Navigate, useParams } from 'react-router';
import type { JSX } from 'react';

export default function OrgHomeRedirect(): JSX.Element {
  const { orgHandler = 'default' } = useParams();
  return <Navigate to={`/organizations/${orgHandler}/home`} replace />;
}
