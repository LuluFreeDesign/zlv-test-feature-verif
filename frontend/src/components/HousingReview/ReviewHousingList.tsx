import { fr } from '@codegouvfr/react-dsfr';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import type { Housing } from '~/models/Housing';

export interface ReviewHousingListProps {
  housings: ReadonlyArray<Housing>;
  selectedId: string | null;
  onSelect(housingId: string): void;
}

const ListItemButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'selected'
})<{ selected: boolean }>(({ selected }) => ({
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
  // Separator between housings.
  borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
  padding: '0.75rem 1rem',
  backgroundColor: selected
    ? fr.colors.decisions.background.alt.blueFrance.default
    : 'transparent'
}));

function ReviewHousingList(props: Readonly<ReviewHousingListProps>) {
  return (
    <Box
      component="ul"
      sx={{ listStyle: 'none', m: 0, p: 0 }}
      aria-label="Logements à éditer"
    >
      {props.housings.map((housing) => {
        const selected = props.selectedId === housing.id;
        return (
          <li key={housing.id}>
            <ListItemButton
              type="button"
              selected={selected}
              aria-current={selected ? 'true' : undefined}
              onClick={() => props.onSelect(housing.id)}
            >
              <Stack>
                <Typography
                  component="span"
                  sx={{ fontWeight: selected ? 700 : 500 }}
                >
                  {housing.rawAddress.join(', ')}
                </Typography>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    color: fr.colors.decisions.text.mention.grey.default
                  }}
                >
                  {housing.owner?.fullName ?? 'Propriétaire inconnu'}
                </Typography>
              </Stack>
            </ListItemButton>
          </li>
        );
      })}
    </Box>
  );
}

export default ReviewHousingList;
