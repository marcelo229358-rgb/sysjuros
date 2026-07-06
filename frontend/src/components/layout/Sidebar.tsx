import { SidebarNav } from './SidebarNav';

export function Sidebar() {
  return (
    <aside className="sidebar bg-body-tertiary border-end p-3 d-none d-md-block">
      <SidebarNav />
    </aside>
  );
}
