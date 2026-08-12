import { Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';

const ProjectFolders = lazy(() => import('../pages/availability/ProjectFolders'));
const ProjectForm    = lazy(() => import('../pages/availability/ProjectForm'));
const ProjectDetail  = lazy(() => import('../pages/availability/ProjectDetail'));
const BlockDetail    = lazy(() => import('../pages/availability/BlockDetail'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const availabilityRoutes = (
  <>
    {/* Project folder list */}
    <Route path="availability/projects"          element={withSuspense(ProjectFolders)} />

    {/* Add / edit / view wizard */}
    <Route path="availability/projects/add"             element={withSuspense(ProjectForm)} />
    <Route path="availability/projects/edit/:id"        element={withSuspense(ProjectForm)} />
    <Route path="availability/projects/view/:id"        element={withSuspense(ProjectForm)} />

    {/* Project detail (blocks overview) */}
    <Route path="availability/projects/:id"             element={withSuspense(ProjectDetail)} />

    {/* Block detail (unit grid) */}
    <Route path="availability/projects/:projectId/blocks/:blockId" element={withSuspense(BlockDetail)} />
  </>
);
