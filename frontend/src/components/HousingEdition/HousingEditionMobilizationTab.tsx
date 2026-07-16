import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import {
  HOUSING_STATUS_VALUES,
  HousingStatus,
  type Precision
} from '@zerologementvacant/models';
import {
  useController,
  useFormContext,
  type FieldValues
} from 'react-hook-form';

import { getSubStatusOptions } from '~/models/HousingState';
import HousingStatusSelect from '../HousingListFilters/HousingStatusSelect';
import HousingSubStatusSelect from '../HousingListFilters/HousingSubStatusSelect';
import PrecisionLists, { type PrecisionListProps } from '~/components/Precision/PrecisionLists';

interface BaseSchema extends FieldValues {
  status: HousingStatus | null;
  subStatus: string | null;
  precisions: ReadonlyArray<Precision>;
}

export type HousingEditionMobilizationTabProps = {
  precisionListProps?: Pick<PrecisionListProps, 'multiple' | 'showNullOption'>;
  /**
   * Which parts of the tab to render — lets callers split the status and the
   * precisions across different parts of a layout (e.g. the housing review
   * screen).
   * @default ['status', 'precisions']
   */
  sections?: ReadonlyArray<'status' | 'precisions'>;
  /**
   * Tighter vertical spacing between the heading and the fields (e.g. the
   * housing review screen, where this block sits above the fold).
   * @default false
   */
  compact?: boolean;
};

function HousingEditionMobilizationTab(
  props: Readonly<HousingEditionMobilizationTabProps>
) {
  const sections = props.sections ?? ['status', 'precisions'];
  const showStatus = sections.includes('status');
  const showPrecisions = sections.includes('precisions');
  // Use a literal rem value (not a MUI spacing multiplier) so this matches
  // exactly the sibling "Occupation" column's Stack spacing in compact mode.
  const statusGap = props.compact ? '0.5rem' : 2;
  const form = useFormContext();
  const { field: statusField, fieldState: statusFieldState } = useController<
    BaseSchema,
    'status'
  >({
    name: 'status'
  });
  const { field: subStatusField, fieldState: subStatusFieldState } =
    useController<BaseSchema, 'subStatus'>({
      name: 'subStatus'
    });
  const { field: precisionField } = useController<BaseSchema, 'precisions'>({
    name: 'precisions'
  });

  const subStatusDisabled =
    statusField.value === null ||
    getSubStatusOptions(statusField.value).length === 0;

  return (
    <Grid component="section" container sx={{ rowGap: 2 }}>
      {showStatus && (
        <Grid
          component="article"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: statusGap,
            ...(props.compact && {
              '& .fr-select-group': { marginBottom: '0 !important' }
            })
          }}
          size={12}
        >
          {!props.compact && (
            <Typography component="h3" variant="h6">
              Statut de suivi
            </Typography>
          )}
          <HousingStatusSelect
            error={statusFieldState.error?.message}
            invalid={statusFieldState.invalid}
            options={HOUSING_STATUS_VALUES}
            value={statusField.value}
            onChange={(value) => {
              statusField.onChange(value);
              form.setValue('subStatus', null);
              form.clearErrors('subStatus');
            }}
          />
          <HousingSubStatusSelect
            disabled={subStatusDisabled}
            multiple={false}
            options={
              statusField.value
                ? getSubStatusOptions(statusField.value).map(
                    (option) => option.value
                  )
                : []
            }
            error={subStatusFieldState.error?.message}
            invalid={subStatusFieldState.invalid}
            value={subStatusField.value}
            onBlur={subStatusField.onBlur}
            onChange={subStatusField.onChange}
          />
        </Grid>
      )}
      {showPrecisions && (
        <PrecisionLists
          {...props.precisionListProps}
          value={precisionField.value}
          onChange={precisionField.onChange}
        />
      )}
    </Grid>
  );
}

export default HousingEditionMobilizationTab;
