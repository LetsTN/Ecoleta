import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Map, TileLayer, Marker } from 'react-leaflet';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

import api from '../../services/api';

import './style.css'

import logo from '../../assets/logo.svg';

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface ibgeUf {
    sigla: string;
}

interface ibgeCity {
    nome: string;
}

const CreatePoint = () => {

    //info form
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    });

    //info endereço
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCity] = useState<string[]>([]);

    const [SelectedUf, setSelectedUf] = useState('0');
    const [SelectedCity, setSelectedCity] = useState('0');

    const [SelectedPosition, setSelectedPosition] = useState<[number, number]>([0,0]);
    const [InitialPosition, setInitialPosition] = useState<[number, number]>([0,0]);

    //info itens
    const [items, setItems] = useState<Item[]>([]);
    const [SelectedItems, setSelectedItems] = useState<number[]>([]);

    //para a telinha de sucesso :)
    const [success, setSuccess] = useState(false);

    //items
    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        })
    });

    //UF
    useEffect(() => {
        axios.get<ibgeUf[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);
            setUfs(ufInitials);
        })
    }, []);

    //city
    useEffect(() => {
        if (SelectedUf === '0') return;

        axios.get<ibgeCity[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${SelectedUf}/municipios`).then(response => {
            const cityNames = response.data.map(city => city.nome);
            setCity(cityNames);
        })
    }, [SelectedUf]);

    //initial position
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;

            setInitialPosition([latitude,longitude]);
        })
    }, [])

    function handleSelectedUf(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value;

        setSelectedUf(uf);
    }

    function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value;

        setSelectedCity(city);
    }

    function handleMapClick(event: LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value
        })
    }

    function handleSelectItem(id: number){
        const alreadySelected = SelectedItems.findIndex(item => item === id);
        
        if (alreadySelected >= 0){
            const filteredItems = SelectedItems.filter(item => item !== id);

            setSelectedItems(filteredItems);
        } else {
            setSelectedItems([ 
                ...SelectedItems, 
                id
            ])
        }
    }
    
    async function handleSubmit(event: FormEvent){
        event.preventDefault();
        
        const { name, email, whatsapp } = formData;

        const uf = SelectedUf;
        const city = SelectedCity;
        const [latitude, longitude] = SelectedPosition

        const items = SelectedItems;

        const data = {
            name, 
            email, 
            whatsapp,
            uf, 
            city, 
            latitude, 
            longitude,
            items
        };

        await api.post('points', data);

        setSuccess(true);
        window.scrollTo(0, 0);
    }

    return ( 
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />

                <Link to='/'>
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> Ponto de Coleta</h1>
                
                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da Entidade</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input
                                type="text"
                                name="whatsapp"
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                     
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={InitialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={SelectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select 
                                name="uf" 
                                id="uf" 
                                value={SelectedUf} 
                                onChange={handleSelectedUf}
                            >
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select 
                                name="city" 
                                id="city"
                                value={SelectedCity} 
                                onChange={handleSelectedCity}
                            >
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de Coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            <li 
                                key={item.id} 
                                onClick={() => handleSelectItem(item.id)}
                                className={SelectedItems.includes(item.id) ? 'selected' : ''}
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">
                    Cadastrar Ponto de Coleta
                </button>
            </form>

            { success &&
                <div className="success">
                    <h1>
                        <FiCheckCircle />
                        Cadastro concluído!
                    </h1>

                    <Link to="/">
                        <strong>
                            Ok
                        </strong>
                    </Link>
                </div>
            }

        </div>
    )
};

export default CreatePoint;