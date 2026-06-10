import { fr } from '@codegouvfr/react-dsfr';
import Badge from '@codegouvfr/react-dsfr/Badge';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import type { Housing } from '~/models/Housing';

export interface ReviewHousingListProps {
  housings: ReadonlyArray<Housing>;
  selectedId: string | null;
  isVerified(housingId: string): boolean;
  onSelect(housingId: string): void;
}

const ListItemButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'verified'
})<{ selected: boolean; verified: boolean }>(({ selected, verified }) => ({
  display: 'block',
  width: '100%',
  textAlign: 'left',
  cursor: 'pointer',
  border: 'none',
  borderLeft: `0.25rem solid ${
    selected
      ? fr.colors.decisions.border.active.blueFrance.default
      : 'transparent'
  }`,
  padding: '0.75rem 1rem',
  backgroundColor: verified
    ? fr.colors.decisions.background.contrast.success.default
    : selected
      ? fr.colors.decisions.background.alt.blueFrance.default
      : 'transparent',
  '&:hover': {
    backgroundColor: verified
      ? fr.colors.decisions.background.contrast.success.hover
      : fr.colors.decisions.background.alt.blueFrance.hover
  }
}));

function ReviewHousingList(props: Readonly<ReviewHousingListProps>) {
  return (
    <Stack
      component="ul"
      sx={{ listStyle: 'none', m: 0, p: 0 }}
      aria-label="Logements à vérifier"
    >
      {props.housings.map((housing) => {
        const verified = props.isVerified(housing.id);
        const selected = props.selectedId === housing.id;
        return (
          <li key={housing.id}>
            <ListItemButton
              type="button"
              selected={selected}
              verified={verified}
              aria-current={selected ? 'true' : undefined}
              onClick={() => props.onSelect(housing.id)}
            >
              <Stack
                direction="row"
                spacing="0.5rem"
                useFlexGap
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Typography
                  component="span"
                  sx={{ fontWeight: selected ? 700 : 500 }}
                >
                  {housing.rawAddress.join(', ')}
                </Typography>
                {verified ? (
                  <Badge severity="success" small noIcon={false}>
                    Vérifié
                  </Badge>
                ) : null}
              </Stack>
              <Typography
                component="span"
                variant="body2"
                sx={{ color: fr.colors.decisions.text.mention.grey.default }}
              >
                {housing.owner?.fullName ?? 'Propriétaire inconnu'}
              </Typography>
            </ListItemButton>
          </li>
        );
      })}
    </Stack>
  );
}

export default ReviewHousingList;
