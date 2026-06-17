import { fr } from '@codegouvfr/react-dsfr';
import Box from '@mui/material/Box';

export interface ReviewProgressBarProps {
  /** Number of verified housings. */
  value: number;
  /** Total number of housings. */
  total: number;
}

/**
 * Horizontal progress bar inspired by the DSFR Charts "Jauge", showing the raw
 * count "X logement vérifié sur N" inside the bar (no percentage, no legend).
 */
function ReviewProgressBar(props: Readonly<ReviewProgressBarProps>) {
  const { value, total } = props;
  const percentage = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  const label = `${value} logement${value > 1 ? 's' : ''} vérifié${
    value > 1 ? 's' : ''
  } sur ${total}`;

  return (
    <Box
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label}
      sx={{
        // Match the DSFR Charts "Jauge": squared track on a raised-grey
        // background with a grey border (no rounded corners).
        position: 'relative',
        height: '2rem',
        width: '100%',
        overflow: 'hidden',
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        backgroundColor: fr.colors.decisions.background.raised.grey.default
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          insetBlock: 0,
          insetInlineStart: 0,
          width: `${percentage}%`,
          backgroundColor:
            fr.colors.decisions.background.contrast.purpleGlycine.default,
          transition: 'width 0.3s ease'
        }}
      />
      <Box
        component="span"
        sx={{
          position: 'absolute',
          insetBlock: 0,
          insetInlineStart: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          fontWeight: 500,
          color: fr.colors.decisions.text.default.grey.default
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

export default ReviewProgressBar;
