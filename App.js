import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Alert,
  Button
} from 'react-native';

import * as Database from './services/Database';
import Formulario from './components/Formulario';
import ListaRegistros from './components/ListaRegistros';
import Grafico from './components/Graficos';
import * as Sharing from 'expo-sharing';

export default function App() {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [registroEmEdicao, setRegistroEmEdicao] = useState(null);

  useEffect(() => {
    const init = async () => {
      const dados = await Database.carregarDados();
      setRegistros(dados);
      setCarregando(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!carregando) {
      Database.salvarDados(registros);
    }
  }, [registros, carregando]);

  let registrosExibidos = [...registros]; 

  if (ordenacao === 'maior_agua') {
    registrosExibidos.sort((a, b) => b.agua - a.agua);
  } else {
    registrosExibidos.sort((a, b) => b.id - a.id);
  }

  const handleSave = (felicidadeNum, sorrisosNum, calmaNum) => {
    if (felicidadeNum < 0 || sorrisosNum < 0 || calmaNum < 0) {
      return Alert.alert("Erro de Validação", "Nenhum valor pode ser negativo. Por favor, corrija.");
    }

    const novoRegistro = {
      id: new Date().getTime(),
      data: new Date().toLocaleDateString('pt-BR'),
      felicidade: felicidadeNum,
      sorrisos: sorrisosNum,
      calma: calmaNum,
    };

    if (registroEmEdicao) {
      const registrosAtualizados = registros.map(reg =>
        reg.id === registroEmEdicao.id ? { ...reg, felicidade: felicidadeNum, sorrisos: sorrisosNum, calma: calmaNum } : reg
      );
      setRegistros(registrosAtualizados);
      Alert.alert('Sucesso!', 'Registro atualizado!');
    } else {
      setRegistros([...registros, novoRegistro]);
      Alert.alert('Sucesso!', 'Registro salvo!');
    }

    setRegistroEmEdicao(null);
  };

  const handleDelete = (id) => {
    setRegistros(registros.filter(reg => reg.id !== id));
    Alert.alert('Sucesso!', 'O registro foi deletado.');
  };

  const handleEdit = (registro) => {
    setRegistroEmEdicao(registro);
  };

  const handleCancel = () => {
    setRegistroEmEdicao(null);
  };

  const exportarDados = async () => {
    const fileUri = Database.fileUri;
    if (Platform.OS === 'web') {
      const jsonString = JSON.stringify(registros, null, 2);
      if (registros.length === 0) {
        return Alert.alert("Aviso", "Nenhum dado para exportar.");
      }
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dados.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        return Alert.alert("Aviso", "Nenhum dado para exportar.");
      }
      if (!(await Sharing.isAvailableAsync())) {
        return Alert.alert("Erro", "Compartilhamento não disponível.");
      }
      await Sharing.shareAsync(fileUri);
    }
  };

  if (carregando) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#3498db" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.titulo}>Minha Vida em Numeros</Text>
        <Text style={styles.subtituloApp}>App Componentizado</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10, gap: 10 }}>
          <Button title="Mais Recentes" onPress={() => setOrdenacao('recentes')} />
          <Button title="Maior Valor (Água)" onPress={() => setOrdenacao('maior_agua')} />
        </View>

        <Formulario 
          onSave={handleSave} 
          onCancel={handleCancel}
          registroEmEdicao={registroEmEdicao}
        />

        <ListaRegistros 
          registros={registrosExibidos}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <Grafico registros={registrosExibidos} />

        <View style={styles.card}>
          <Text style={styles.subtitulo}>Exportar "Banco de Dados"</Text>
          <TouchableOpacity style={styles.botaoExportar} onPress={exportarDados}>
            <Text style={styles.botaoTexto}>Exportar arquivo dados.json</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#01579b',
  },
  subtituloApp: {
    textAlign: 'center',
    fontSize: 16,
    color: '#757575',
    marginTop: -20,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  subtitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#34495e',
  },
  botaoExportar: {
    backgroundColor: '#66bb6a',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  botaoTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
