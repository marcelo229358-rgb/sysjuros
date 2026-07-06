import { useCallback, useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import { notificacaoApi, Notificacao } from '../../api/notificacao.api';
import { formatarData } from '../../utils/formatarData';

export function NotificacoesSino() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [aberto, setAberto] = useState(false);

  const buscar = useCallback(async () => {
    try {
      setNotificacoes(await notificacaoApi.listar());
    } catch {
      /* silencioso no polling */
    }
  }, []);

  useEffect(() => {
    buscar();
    const intervalo = setInterval(buscar, 60_000);
    return () => clearInterval(intervalo);
  }, [buscar]);

  async function marcarTodas() {
    await notificacaoApi.marcarTodasComoLidas();
    setNotificacoes([]);
    setAberto(false);
  }

  async function marcarUma(id: string) {
    await notificacaoApi.marcarComoLida(id);
    setNotificacoes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <Dropdown show={aberto} onToggle={(next) => setAberto(!!next)} align="end">
      <Dropdown.Toggle
        variant="outline-secondary"
        size="sm"
        className="position-relative"
        data-testid="btn-notificacoes"
      >
        🔔
        {notificacoes.length > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle"
            data-testid="badge-notificacoes"
          >
            {notificacoes.length}
          </Badge>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu className="dropdown-menu-notificacoes" style={{ maxHeight: 400, overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <span className="fw-semibold small">Notificações</span>
          {notificacoes.length > 0 && (
            <Button variant="link" size="sm" className="p-0" onClick={marcarTodas}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        {notificacoes.length === 0 ? (
          <Dropdown.ItemText className="text-muted small px-3 py-3">
            Nenhuma notificação nova
          </Dropdown.ItemText>
        ) : (
          notificacoes.map((n) => (
            <Dropdown.Item
              key={n.id}
              onClick={() => marcarUma(n.id)}
              className="py-2"
              data-testid="item-notificacao"
            >
              <div className="fw-semibold small">{n.titulo}</div>
              <div className="small text-muted">{n.mensagem}</div>
              <div className="small text-muted">{formatarData(n.criadoEm)}</div>
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
