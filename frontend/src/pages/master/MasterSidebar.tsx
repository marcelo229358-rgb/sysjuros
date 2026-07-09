import { MasterSecao } from '../../api/master.api';

const ITENS: { id: MasterSecao; label: string; icon: string }[] = [
  { id: 'empresas', label: 'Empresas', icon: '🏢' },
  { id: 'clientes', label: 'Clientes', icon: '👥' },
  { id: 'assinaturas', label: 'Assinaturas', icon: '📄' },
  { id: 'financeiro', label: 'Financeiro', icon: '📈' },
  { id: 'permissoes', label: 'Permissões', icon: '🛡️' },
  { id: 'monitoramento', label: 'Monitoramento', icon: '💓' },
];

interface Props {
  secao: MasterSecao;
  onChange: (secao: MasterSecao) => void;
}

export function MasterSidebar({ secao, onChange }: Props) {
  return (
    <nav className="master-sidebar">
      {ITENS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`master-nav-btn ${secao === item.id ? 'active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          <span aria-hidden>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
