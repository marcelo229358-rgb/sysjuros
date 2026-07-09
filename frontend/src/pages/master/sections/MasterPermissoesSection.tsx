import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import { masterApiClient } from '../../../api/master.api';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

interface Props {
  onAlert: (tipo: 'erro' | 'sucesso', msg: string) => void;
}

export function MasterPermissoesSection({ onAlert }: Props) {
  const [meta, setMeta] = useState<{ profiles: string[]; modules: string[]; actions: string[] } | null>(
    null
  );
  const [perfil, setPerfil] = useState('admin');
  const [permissoes, setPermissoes] = useState<Record<string, string[]>>({});
  const [carregando, setCarregando] = useState(true);

  async function carregarMeta() {
    const m = await masterApiClient.permissoesMeta();
    setMeta(m);
    if (!m.profiles.includes(perfil)) setPerfil(m.profiles[0] ?? 'admin');
  }

  async function carregarPerfil(p: string) {
    setCarregando(true);
    try {
      const rows = await masterApiClient.listarPermissoes(p);
      const map: Record<string, string[]> = {};
      rows.forEach((row: { modulo: string; acoes: string[] }) => {
        map[row.modulo] = row.acoes;
      });
      setPermissoes(map);
    } catch {
      onAlert('erro', 'Erro ao carregar permissões');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarMeta().then(() => carregarPerfil(perfil));
  }, []);

  useEffect(() => {
    if (meta) carregarPerfil(perfil);
  }, [perfil]);

  async function toggle(modulo: string, acao: string) {
    const atuais = permissoes[modulo] ?? [];
    const novas = atuais.includes(acao)
      ? atuais.filter((a) => a !== acao)
      : [...atuais, acao];

    try {
      await masterApiClient.atualizarPermissao({ perfil, modulo, acoes: novas });
      setPermissoes({ ...permissoes, [modulo]: novas });
      onAlert('sucesso', 'Permissão atualizada.');
    } catch {
      onAlert('erro', 'Erro ao salvar permissão');
    }
  }

  if (!meta) return <LoadingSpinner />;

  return (
    <div className="master-card">
      <h2>Matriz de permissões</h2>
      <Form.Group className="mb-3" style={{ maxWidth: 240 }}>
        <Form.Label>Perfil</Form.Label>
        <Form.Select value={perfil} onChange={(e) => setPerfil(e.target.value)}>
          {meta.profiles.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {carregando ? (
        <LoadingSpinner />
      ) : (
        <div className="table-responsive">
          <Table className="master-table table-dark table-borderless">
            <thead>
              <tr>
                <th>Módulo</th>
                {meta.actions.map((a) => (
                  <th key={a} className="text-center">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meta.modules.map((modulo) => (
                <tr key={modulo}>
                  <td>{modulo}</td>
                  {meta.actions.map((acao) => {
                    const ativo = (permissoes[modulo] ?? []).includes(acao);
                    return (
                      <td key={acao} className="text-center">
                        <Button
                          size="sm"
                          variant={ativo ? 'success' : 'outline-secondary'}
                          onClick={() => toggle(modulo, acao)}
                        >
                          {ativo ? '✓' : '—'}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
