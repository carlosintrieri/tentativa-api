INSERT INTO estacoes (nome, uid, endereco, responsavel, lat, long, descricao, ativo) 
VALUES 
('Estação Centro', 'EST001', 'Rua XV', 'João', '-23.55', '-46.63', 'Teste', true),
('Estação Norte', 'EST002', 'Av. Paulista', 'Maria', '-23.56', '-46.64', 'Teste 2', true);

INSERT INTO tipos_parametro (nome, fator, valor_offset) 
VALUES 
('Temperatura', 1, 0),
('Umidade', 1, 0),
('Chuva', 1, 0);

INSERT INTO parametros (id_estacao, id_tipo_parametro) 
VALUES 
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 2), (2, 3);