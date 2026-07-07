import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';

import { useUser } from '~/hooks/useUser';
import PerimetersModalOpener from '~/components/modals/GeoPerimetersModal/PerimetersModalOpener';
import createPerimetersModal from '~/components/modals/GeoPerimetersModal/PerimetersModal';
import styles from './map-controls.module.scss';

const perimetersModal = createPerimetersModal();

interface Props {
  clusterize: boolean;
  perimeters: boolean;
  /**
   * @default true
   */
  show?: boolean;
  /** Hide the "Grouper les bâtiments" toggle (e.g. in the review screen). */
  hideClusterize?: boolean;
  onClusterizeChange(checked: boolean): void;
  onPerimetersChange(checked: boolean): void;
}

function MapControls(props: Props) {
  const { isVisitor } = useUser();
  const show = props.show ?? true;

  if (!show) {
    return null;
  }

  return (
    <section className={styles.controls}>
      <ToggleSwitch
        checked={props.perimeters}
        label="Afficher vos périmètres"
        onChange={props.onPerimetersChange}
      />

      <perimetersModal.Component />
      {!isVisitor && (
        <PerimetersModalOpener className="fr-my-1w" modal={perimetersModal} />
      )}

      {!props.hideClusterize && (
        <>
          <hr />

          <ToggleSwitch
            checked={props.clusterize}
            label="Grouper les bâtiments"
            onChange={props.onClusterizeChange}
          />
        </>
      )}
    </section>
  );
}

export default MapControls;
