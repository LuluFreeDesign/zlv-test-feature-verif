import Button from '@codegouvfr/react-dsfr/Button';
import type { HousingFiltersDTO } from '@zerologementvacant/models';
import { useNavigate } from 'react-router';

import { pluralize } from '~/utils/stringUtils';

export interface ReviewHousingsButtonProps {
  /** Filters identifying the housings to review (parc filters, ownerIds, groupIds…). */
  filters: HousingFiltersDTO;
  /** Number of housings that will be reviewed (shown in the label). */
  count: number;
  className?: string;
}

/**
 * Launches the sequential review/edition flow over a set of housings. The set
 * is described by `filters` (current parc filters + selection, a single owner,
 * a group…) and passed to the review page via the router state.
 */
function ReviewHousingsButton(props: Readonly<ReviewHousingsButtonProps>) {
  const navigate = useNavigate();

  return (
    <Button
      className={props.className}
      priority="secondary"
      size="medium"
      iconId="fr-icon-checkbox-circle-line"
      disabled={props.count === 0}
      onClick={() =>
        navigate('/parc-de-logements/passer-en-revue', {
          state: { filters: props.filters }
        })
      }
    >
      Passer en revue {props.count} {pluralize(props.count)('logement')}
    </Button>
  );
}

export default ReviewHousingsButton;
