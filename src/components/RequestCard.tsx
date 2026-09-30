import { router } from 'expo-router';
import { formatDays, formatRange, leaveTypeById, requestDays, statusLabel, TimeOffRequest } from '../data';
import { Card, IconBox, Pill, Row, Txt, useStatusColors } from './ui';

export function RequestCard({ request }: { request: TimeOffRequest }) {
  const status = useStatusColors()[request.status];
  const type = leaveTypeById[request.type];
  return (
    <Card>
      <Row onPress={() => router.push(`/request/${request.id}`)} style={{ paddingHorizontal: 14, paddingVertical: 13 }}>
        <IconBox icon={status.icon} bg={status.bg} fg={status.fg} />
        <Txt style={{ flex: 1 }} numberOfLines={2}>
          <Txt weight="700">
            {formatDays(requestDays(request))} · {type.short}
            {'\n'}
          </Txt>
          <Txt size={12} color="muted">
            {formatRange(request.from, request.to)} · {type.label}
          </Txt>
        </Txt>
        <Pill label={statusLabel(request)} fg={status.fg} bg={status.bg} />
      </Row>
    </Card>
  );
}
