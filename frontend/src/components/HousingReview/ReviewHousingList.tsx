import { fr } from '@codegouvfr/react-dsfr';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import Icon from '~/components/ui/Icon';
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
  // Separator between housings.
  borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
  padding: '0.75rem 1rem',
  // Selected (not verified) keeps the blue/grey tint; verified is green.
  backgroundColor: selected
    ? fr.colors.decisions.background.alt.blueFrance.default
    : verified
      ? 'var(--green-bourgeon-975)'
      : 'transparent'
}));

function ReviewHousingList(props: Readonly<ReviewHousingListProps>) {
  return (
    <Box
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
                sx={{ alignItems: 'flex-start' }}
              >
                {verified ? (
                  <Icon
                    name="fr-icon-check-line"
                    size="sm"
                    color={fr.colors.decisions.text.default.success.default}
                  />
                ) : null}
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
              </Stack>
            </ListItemButton>
          </li>
        );
      })}
    </Box>
  );
}

export default ReviewHousingList;
