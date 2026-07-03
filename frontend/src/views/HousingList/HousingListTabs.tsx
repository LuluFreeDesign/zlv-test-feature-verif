import { fr } from '@codegouvfr/react-dsfr';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import type { ReactNode } from 'react';

import { useStatusTabs } from '~/hooks/useStatusTabs';
import { type HousingFilters } from '~/models/HousingFilters';
import HousingListTab from './HousingListTab';

export interface HousingListTabsProps {
  filters: HousingFilters;
  /**
   * @default true
   */
  showCount?: boolean;
  showRemoveGroupHousing?: boolean;
  /** Actions rendered inside the table header row (review, add-to-group…). */
  headerActions?: ReactNode;
}

function HousingListTabs({
  filters,
  showCount,
  showRemoveGroupHousing,
  headerActions
}: Readonly<HousingListTabsProps>) {
  const { activeStatus, activeTab, tabs, setActiveTab } =
    useStatusTabs(filters);

  return (
    <Tabs
      classes={{
        panel: fr.cx('fr-p-0')
      }}
      className="tabs-no-border statusTabs"
      selectedTabId={activeTab}
      onTabChange={setActiveTab}
      tabs={tabs}
    >
      <HousingListTab
        filters={{
          ...filters,
          status: activeStatus.value
        }}
        isActive={true}
        key={`status-tab-${activeStatus.id}`}
        showCount={showCount}
        showRemoveGroupHousing={showRemoveGroupHousing}
        status={activeStatus.value}
        headerActions={headerActions}
      />
    </Tabs>
  );
};

export default HousingListTabs;
