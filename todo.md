# RPG Companion Web - TODO

## Banco de Dados e Backend
- [x] Criar schema: tabelas de personagens, atributos, habilidades e histórico de rolagens
- [x] Implementar procedures tRPC para CRUD de personagens
- [x] Implementar procedures tRPC para rolagem de dados e histórico
- [x] Implementar procedures tRPC para gerenciamento de canvas do Mestre
- [x] Adicionar validação de ownership em todos os procedures

## Autenticação
- [x] Configurar OAuth Manus (já vem no template)
- [x] Testar login e logout
- [x] Implementar persistência de sessão

## Gerenciamento de Personagens
- [x] Criar página de personagens com listagem
- [x] Implementar modal/formulário de criação de personagem
- [x] Implementar modal/formulário de edição de personagem
- [x] Implementar exclusão de personagem
- [x] Validar campos obrigatórios (nome, classe, raça, etc)
- [x] Testar persistência em banco de dados

## Sistema de Rolagem de Dados
- [x] Criar interface de seleção de tipo de dado (d4-d100)
- [x] Implementar lógica de rolagem com animação
- [x] Implementar aplicação de bônus de atributos
- [x] Implementar detecção de críticos (d20=20) e falhas (d20=1)
- [x] Criar histórico de rolagens persistido
- [x] Implementar visualização do histórico

## Tela do Mestre
- [x] Criar canvas interativo para desenho
- [x] Implementar ferramentas: caneta, borracha
- [x] Implementar paleta de cores
- [x] Implementar upload de imagens como fundo
- [x] Implementar limpeza de canvas
- [x] Implementar persistência do desenho

## Interface de Jogador
- [x] Criar sistema de abas (Lobby, Dados, Personagens, Tela do Mestre)
- [x] Implementar seleção de role (Mestre/Jogador)
- [x] Implementar seleção de personagem ativo
- [x] Criar painel de status do personagem (HP, Vigor)
- [x] Implementar modal de detalhes de habilidades
- [x] Implementar visibilidade condicional de abas por role

## Testes e Qualidade
- [x] Escrever testes vitest para procedures tRPC
- [x] Testar fluxo completo de autenticação
- [x] Testar CRUD de personagens
- [x] Testar rolagem de dados
- [x] Validar persistência em banco de dados

## Publicação
- [x] Criar checkpoint final
- [x] Publicar site (pronto para publicar via Management UI)

## Novos Requisitos (Adicionados pelo Usuário)

### Atributos Personalizáveis
- [x] Criar UI para editar atributos de cada personagem
- [x] Implementar persistência de atributos no banco
- [x] Aplicar bônus de atributos dinamicamente na rolagem de dados
- [x] Exibir bônus aplicados no histórico de rolagens

### Canvas Compartilhado
- [x] Restringir edição do canvas apenas ao Mestre
- [x] Permitir que todos os jogadores vejam o canvas
- [x] Implementar atualização em tempo real do canvas
- [x] Sincronizar canvas entre múltiplos usuários
- [x] Integrar masterId no contexto RPG
- [x] Adicionar suporte a masterId nos procedures tRPC

## Refinamentos Solicitados pelo Usuário

### Atributos na Criação
- [x] Mover campos de atributos para modal de criação de personagem
- [x] Remover página separada de atributos
- [x] Adicionar botão "Editar" em cada personagem para editar atributos

### Visibilidade da Aba Personagens
- [x] Ocultar aba Personagens quando role é Mestre
- [x] Mostrar aba Personagens quando role é Jogador
- [x] Manter personagens salvos ao trocar de role
- [x] Restaurar aba ao voltar para Jogador

## Novos Requisitos - Multiplayer e UI Responsiva

### Painel de Lobby
- [x] Exibir lista de jogadores online no lobby
- [x] Mostrar personagem escolhido de cada jogador
- [x] Destacar quem é o Mestre
- [x] Atualizar lista em tempo real
- [x] Implementar backend de sessão com tabela sessionParticipants
- [x] Criar procedures tRPC para join/leave/getUsers

### Painel Lateral no Canvas
- [x] Criar painel lateral mostrando participantes
- [x] Exibir personagem e status de cada participante
- [x] Mostrar quem é o Mestre no painel
- [x] Manter painel visível ao lado do canvas
- [x] Integrar dados reais de sessão

### Canvas Responsivo
- [x] Expandir canvas para aproveitar espaço vertical
- [x] Ajustar tamanho do canvas conforme resolução da tela
- [x] Manter proporção e usabilidade em diferentes dispositivos
- [x] Otimizar layout para desktop (computador)
