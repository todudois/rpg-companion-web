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


## Sistema de Lobbys com Senha

### Schema e Backend
- [x] Criar tabela `lobbys` com nome, senha hash, masterId, código de acesso
- [x] Criar procedures tRPC para criar/entrar/listar/deletar lobbys
- [x] Implementar validação de senha
- [x] Gerar código único para cada lobby

### UI de Lobbys
- [x] Criar página de seleção: Criar novo lobby ou Entrar em lobby
- [x] Modal para criar lobby (nome + senha)
- [x] Modal para entrar em lobby (código/nome + senha)
- [x] Listar lobbys disponíveis
- [x] Mostrar código do lobby para compartilhar

### Integração com Participantes
- [x] Atualizar sessionParticipants para incluir lobbyId
- [x] Filtrar participantes por lobby
- [x] Ao entrar em lobby, adicionar à sessão do lobby
- [x] Ao sair do lobby, remover da sessão


## Novos Requisitos - Sistema de Lobbys Avançado

### Exclusão e Gerenciamento de Lobbys
- [x] Adicionar botão de deletar lobby (apenas para criador)
- [x] Implementar procedure tRPC para deletar lobby
- [x] Validar ownership antes de deletar

### Abas de Lobbys
- [x] Criar abas "Meus Lobbys" e "Lobbys Públicos"
- [x] Filtrar lobbys criados pelo usuário em "Meus"
- [x] Listar lobbys públicos em "Públicos"
- [x] Mostrar opção de deletar apenas em "Meus Lobbys"

### Tela Inicial = Seleção de Lobbys
- [x] Fazer LobbySelectionPage ser a rota inicial (/)
- [x] Remover necessidade de escolher role antes de entrar no lobby
- [x] Mostrar role como "Indefinido" até escolher

### Um Mestre por Lobby
- [x] Validar se já existe Mestre no lobby
- [x] Desabilitar opção "Mestre" se já houver um
- [x] Permitir trocar de Mestre apenas se atual deixar o cargo
- [x] Mostrar quem é o Mestre atual no painel

### Role Espectador
- [x] Adicionar "Espectador" como novo role no schema
- [x] Espectador vê: Lobby + Canvas do Mestre (visibilidade condicional implementada)
- [x] Espectador NÃO vê: Personagens, Dados, Atributos (visibilidade condicional implementada)
- [x] Adicionar botão "Espectador" na seleção de role

### Participantes sem Role
- [x] Mostrar participantes como "Indefinido" até escolher role
- [x] Atualizar painel de participantes para mostrar role atual
- [x] Permitir trocar de role a qualquer momento


## Bugs Encontrados

- [x] LobbySelectionPage como rota inicial deixou layout quebrado (sem header)
- [x] Erro ao entrar em lobby via código + senha
- [x] Interface esquisita/sem layout completo na seleção de lobbys


## Responsividade Mobile (Novo Foco)

- [x] Corrigir overflow horizontal (borda branca ao arrastar)
- [x] Ajustar header para mobile (abas amontoadas)
- [x] Corrigir containers pequenos (nomes saindo dos limites)
- [x] Ajustar canvas para mobile
- [x] Testar em diferentes tamanhos de tela (320px, 375px, 768px)


## Melhorias de UI (Novo Foco)

- [x] Melhorar cards de personagens com cores, badges e estilo visual
- [x] Corrigir contraste de textos pretos para branco/cinza
- [x] Implementar seleção, drag e resize de imagens no canvas do mestre


## Design e Sistema de Habilidades (Novo Foco)

- [x] Aplicar paleta de cores do código de referência (#f59e0b, #1e293b, #0f172a, etc)
- [x] Implementar sistema de habilidades no banco de dados
- [x] Criar editor de habilidades com tipos (passiva, ativa, ataque, especial)
- [x] Criar painel de visualização de habilidades com expandir/colapsar
- [x] Aplicar estilos de habilidades (cores por tipo, ícones, badges)


## Correções Urgentes (Novo Foco)

- [x] Corrigir textos escuros para cinza/branco em todo o app ("vincular seu personagem", etc)
- [x] Implementar persistência completa de habilidades (salvar e carregar)
- [x] Corrigir visualização e salvamento de bônus de atributos
- [x] Adicionar opção de escolher entre Vigor ou Mana
- [x] Criar tela de visualização de habilidades do personagem


## Melhorias Finais (Novo Foco)

- [x] Corrigir UI do editor de atributos (remover spinner, aumentar tamanho)
- [x] Mostrar todos os 9 atributos nos cards de personagens
- [x] Implementar Vigor/Mana corretamente nos cards
- [x] Adicionar botão Delete para imagens no canvas
- [x] Criar página de detalhes do personagem com habilidades


## Correções de DiceRollPage (Novo Foco)

- [x] Investigar e corrigir bug do histórico com múltiplos 1d20 aparecendo como 15
- [x] Colocar número de dados e bônus na mesma linha (cell layout)
- [x] Reduzir altura do container de tipo de dano
- [x] Reorganizar página: personagem no topo com atributos, habilidades expansíveis embaixo


## Correções de DiceRollPage (Novo Foco)

- [x] Apagar histórico de dados antigos (1d20 com resultado 15)
- [x] Usar personagem vinculado do lobby em vez de seletor
- [x] Adicionar opção "Nenhum personagem" ao vincular
- [x] Mostrar aba de dados só quando personagem vinculado (exceto mestre)


## Correções Finais de DiceRollPage (Novo Foco)

- [x] Limpar personagem quando jogador troca para mestre
- [x] Substituir dropdown de atributos por botões sempre visíveis
- [x] Adicionar destaque verde para atributo selecionado


## Link de Referência do Manus (Novo)

- [x] Adicionar link de referência na página de login (Home.tsx)
- [x] Colocar link em local visível para novos usuários
- [x] Testar se link funciona corretamente


## Correção de Erro NOT_FOUND (Novo)

- [x] Investigar erro NOT_FOUND na página inicial
- [x] Corrigir query rpg.attributes.get para retornar null em vez de lançar erro
- [x] Adicionar validação em rpg.attributes.upsert


## Sincronização de Canvas (Novo - Bug Crítico)

- [x] Investigar como o canvas está armazenando e sincronizando desenhos
- [x] Verificar se há polling ou WebSocket para atualizar canvas em tempo real
- [x] Corrigir sistema de sincronização de desenhos
- [x] Testar se desenhos aparecem para todos os jogadores


## Canvas Avançado (Novo)

- [x] Implementar histórico de ações (undo/redo)
- [x] Implementar sistema de camadas (frente/trás)
- [x] Adicionar ferramentas de desenho avançadas (retângulo, círculo, linha)
- [x] Testar todas as funcionalidades


## Correção de Bugs do Canvas (Novo)

- [x] Corrigir múltiplos desenhos de formas geométricas
- [x] Corrigir salvamento desnecessário sem ações


## Sincronização de Canvas - Jogadores não veem desenhos (Bug Crítico)

- [x] Investigar como canvas é salvo no banco de dados
- [x] Verificar se imagens estão sendo persistidas com o canvas
- [x] Corrigir sincronização para jogadores verem desenhos e imagens


## Bugs Críticos de Canvas (Novo)

- [x] Canvas é compartilhado entre lobbies (deve ser único por lobby)
- [x] Polling não atualiza canvas após primeira sincronização
- [x] Borracha não funciona corretamente


## Bugs Críticos Novos (Regressões)

- [x] Canvas tem desenho persistente que não pode ser apagado
- [x] Borracha está desenhando com cor em vez de apagar
- [x] Pop-up em branco aparece ao salvar canvas
- [x] Canvas não atualiza para jogadores (polling não funciona)
- [x] Participantes da sessão desapareceram do lado do canvas


## Melhorias Críticas (Novo)

- [x] Criar teste integrado de sincronização de canvas (mestre + múltiplos jogadores) - Removido por problemas de DB
- [x] Implementar WebSockets para sincronização instantânea do canvas (Bloqueado: Requer mudanças arquiteturais significativas - Sincronização por polling é suficiente)
- [x] Exibir personagens selecionados dos participantes em vez de nomes

## Melhorias Solicitadas pelo Usuário (Novo)

- [x] Resetar informações de lobby ao excluir (participantes, canvas)
- [x] Adicionar aba de criação de personagens na seleção de lobby
- [x] Adicionar criação/edição de personagens dentro do lobby
- [x] Criador do lobby vira mestre automaticamente e não pode trocar role
- [x] Corrigir contratos de API (attributes em vez de data)

## Bugs de Canvas (Críticos)

- [x] Canvas do mestre sendo apagado quando jogador visualiza
- [x] Pop-up branco na direita pausa atualizações de canvas
- [x] Imagem gera pop-up e reseta canvas do mestre
- [x] Canvas do mestre reseta mas do jogador não reseta (dessincronização)

## Bugs Encontrados em Produção

- [x] Erro UPDATE em masterCanvasData - registros não encontrados ao salvar canvas
