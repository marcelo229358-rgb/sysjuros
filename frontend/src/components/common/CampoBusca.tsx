import Form from 'react-bootstrap/Form';

interface Props {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}

export function CampoBusca({ valor, onChange, placeholder = 'Buscar...' }: Props) {
  return (
    <Form.Control
      type="search"
      placeholder={placeholder}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
