import AppLink from '~/components/_app/AppLink/AppLink';
import EventCard from '~/components/EventsHistory/EventCard';
import type { Event } from '~/models/Event';

interface HousingVerifiedEventCardProps {
  event: Event<'housing:verified'>;
}

/**
 * Event shown in a housing's "Notes et historique" tab when it has been
 * reviewed ("vérifié") from the group review flow. Uses a green-bourgeon
 * "Vérification" badge and lists, behind a "Voir plus" toggle, the
 * modifications made during the review.
 */
export function HousingVerifiedEventCard(
  props: Readonly<HousingVerifiedEventCardProps>
) {
  const { group, modifications } = props.event.nextNew;

  const title = group ? (
    <>
      a vérifié ce logement au sein du groupe «&nbsp;
      <AppLink isSimple to={`/groupes/${group.id}`}>
        {group.title}
      </AppLink>
      &nbsp;»
    </>
  ) : (
    'a vérifié ce logement'
  );

  return (
    <EventCard
      badgeLabel="Vérification"
      badgeColorFamily="green-bourgeon"
      moreLabel="Voir plus"
      title={title}
      differences={modifications}
      createdAt={props.event.createdAt}
      createdBy={props.event.creator}
    />
  );
}

export default HousingVerifiedEventCard;
