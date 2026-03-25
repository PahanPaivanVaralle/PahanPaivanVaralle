import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import {
  useFocusEffect,
  useRoute,
  useNavigation,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pb } from '../lib/pocketbase';
import { styles } from '../global';

interface ImageRecord {
  id: string;
  image: string;
}
interface MapMarkerRecord {
  id: string;
  lang: number;
  long: number;
  title?: string;
  icon?: string;
  color?: string;
  desc?: string;
  likes?: number;
  expand?: { image?: ImageRecord };
}

const TILE_KEY = 'O5UEYayzmhespubk3jjK';
const LIKED_KEY = 'ppv_liked_markers';

const LEAFLET_HTML = `<!DOCTYPE html><html><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<script type="module" src="https://unpkg.com/ionicons@7.4.0/dist/ionicons/ionicons.esm.js"><\/script>
<style>
html,body,#map{height:100%;margin:0;padding:0}
.popup{min-width:280px} .gallery{display:flex;flex-direction:column;gap:10px;max-height:400px;overflow-y:auto}
.gallery img{width:260px;max-height:260px;object-fit:cover;border-radius:10px}
.cnt{background:#3388ff;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;position:absolute;top:-4px;right:-4px;pointer-events:none}
.mw{position:relative;width:36px;height:36px}
.lbtn{background:none;border:1px solid #e0aab0;cursor:pointer;font-size:13px;color:#c0392b;padding:3px 10px;border-radius:12px;margin-top:6px;display:inline-block;transition:background .2s}
.lbtn.on{background:#fde8e8;border-color:#c0392b}
.cbtn{background:none;border:1px solid #8bc34a;cursor:pointer;font-size:13px;color:#388e3c;padding:3px 10px;border-radius:12px;margin-top:6px;display:inline-block;transition:background .2s}
.cbtn.on{background:#e8f5e9;border-color:#388e3c}
.pe{display:flex;flex-direction:column;align-items:flex-start}
</style></head><body><div id="map"></div><script>
var map=L.map('map',{maxZoom:22}).setView([64.5,26],5),msg=function(s){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(s)};
L.tileLayer('https://api.maptiler.com/maps/streets/256/{z}/{x}/{y}.png?key=${TILE_KEY}',{maxZoom:22,maxNativeZoom:19}).addTo(map);
var gps=L.circleMarker([64.5,26],{radius:10,color:'#fff',fillColor:'#3388ff',fillOpacity:1,weight:3}).addTo(map).bindPopup("Sijaintisi");
var C={},T={},liked=new Set(),fl=true,tr=false;
var ck=function(a,b){return parseFloat(a).toFixed(5)+','+parseFloat(b).toFixed(5)};
document.addEventListener('click',function(ev){var btn=ev.target.closest('[data-toggle]');if(btn){var id=btn.getAttribute('data-toggle');msg((liked.has(id)?'unlike:':'like:')+id)}});
var photoHTML=function(e){var l=liked.has(e.markerId),c=l?'lbtn on':'lbtn',h=l?'\\u2764\\ufe0f':'\\u2661';return'<img src="'+e.imageUrl+'"/><button class="'+c+'" data-toggle="'+e.markerId+'">'+h+' '+e.likes+'</button>'};
var galleryHTML=function(a){var n=a.length>1?'<div style="font-size:12px;color:#666;margin-bottom:6px">'+a.length+' kuvaa</div>':'';return'<div class="popup"><div class="gallery">'+n+a.map(function(e){return'<div class="pe">'+photoHTML(e)+'</div>'}).join('')+'</div></div>'};
var taskHTML=function(t,d,img,id,lk){var h='<b>'+t+'</b>';if(d)h+='<br><span style="font-size:13px;color:#555">'+d+'</span>';if(img)h+='<br><img src="'+img+'" style="width:200px;max-height:200px;object-fit:cover;border-radius:8px;margin-top:8px"/>';var l=liked.has(id),c=l?'cbtn on':'cbtn',ch=l?'\\u2705':'\\u2b1c',lb=l?'Tehty':'Merkkaa tehdyksi';h+='<br><button class="'+c+'" data-toggle="'+id+'">'+ch+' '+lb+'</button>';return h};
var mkI=function(n){var b=n>1?'<div class="cnt">'+n+'</div>':'';return L.divIcon({html:'<div class="mw"><div style="background:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,.35)">\\ud83d\\udcf7</div>'+b+'</div>',iconSize:[36,36],iconAnchor:[18,36],popupAnchor:[0,-38],className:''})};
var mkT=function(ic,co){return L.divIcon({html:'<div style="background:'+(co||'#fff')+';border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35)"><ion-icon name="'+ic+'" style="font-size:20px;color:#fff"></ion-icon></div>',iconSize:[36,36],iconAnchor:[18,36],popupAnchor:[0,-38],className:''})};
var addTaskMarker=function(la,lo,t,ic,co,d,img,id,lk){var m=L.marker([la,lo],{icon:mkT(ic||'location',co||'#3388ff')}).addTo(map).bindPopup(taskHTML(t,d,img,id,lk),{maxWidth:240});T[id]={marker:m,t:t,d:d,img:img,lk:lk}};
var addPhotoToCluster=function(la,lo,url,id,lk){var e={imageUrl:url,markerId:id,likes:lk},fk=null;for(var k in C){var dr=(C[k].la-la)*Math.PI/180,dc=(C[k].lo-lo)*Math.PI/180,mr=(C[k].la+la)/2*Math.PI/180,dx=dc*Math.cos(mr)*6371000,dy=dr*6371000;if(Math.sqrt(dx*dx+dy*dy)<20){fk=k;break}}if(fk){C[fk].entries.push(e);C[fk].marker.setIcon(mkI(C[fk].entries.length));C[fk].marker.setPopupContent(galleryHTML(C[fk].entries))}else{var nk=ck(la,lo),m=L.marker([la,lo],{icon:mkI(1)}).addTo(map).bindPopup(galleryHTML([e]),{maxWidth:255});C[nk]={marker:m,entries:[e],la:la,lo:lo}}};
var clearMarkers=function(){for(var k in C)map.removeLayer(C[k].marker),delete C[k];for(var k in T)map.removeLayer(T[k].marker),delete T[k]};
var setLikedIds=function(ids){liked=new Set(ids)};
var updateLikes=function(id,n,on){if(on)liked.add(id);else liked.delete(id);if(T[id]){T[id].lk=n;}else{for(var k in C){var e=C[k].entries.find(function(x){return x.markerId===id});if(e){e.likes=n;break}}}var btn=document.querySelector('[data-toggle="'+id+'"]');if(btn){if(btn.classList.contains('lbtn')){if(on){btn.classList.add('on');btn.innerHTML='\\u2764\\ufe0f '+n;}else{btn.classList.remove('on');btn.innerHTML='\\u2661 '+n;}}else if(btn.classList.contains('cbtn')){if(on){btn.classList.add('on');btn.innerHTML='\\u2705 Tehty';}else{btn.classList.remove('on');btn.innerHTML='\\u2b1c Merkkaa tehdyksi';}}return;}if(T[id]){T[id].marker.setPopupContent(taskHTML(T[id].t,T[id].d,T[id].img,id,n));return;}for(var k in C){var e=C[k].entries.find(function(x){return x.markerId===id});if(e){C[k].marker.setPopupContent(galleryHTML(C[k].entries));return;}}};
var updateLocation=function(la,lo){gps.setLatLng([la,lo]);if(fl){map.setView([la,lo],15);fl=false}else if(tr)map.panTo([la,lo])};
var centerOnUser=function(){tr=true;map.setView(gps.getLatLng(),16)};
map.on('dragstart',function(){if(tr){tr=false;msg('unlock')}});
(function nr(){window.ReactNativeWebView?msg('ready'):setTimeout(nr,50)})();
<\/script></body></html>`;

const js = (code: string) => `${code}; true;`;
const S = JSON.stringify;

export default function MapPage() {
  const webRef = useRef<WebView>(null);
  const locRef = useRef<Location.LocationObject | null>(null);
  const liked = useRef<Set<string>>(new Set());
  const ready = useRef(false);
  const genRef = useRef(0);
  const needsReload = useRef(false);
  const [tracking, setTracking] = useState(false);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const newMarkerParamRef = useRef<any>(undefined);
  newMarkerParamRef.current = route.params?.newMarker;

  const run = (code: string) => webRef.current?.injectJavaScript(js(code));

  const saveLiked = async () => {
    await AsyncStorage.setItem(LIKED_KEY, JSON.stringify([...liked.current]));
  };

  const loadLiked = async () => {
    const raw = await AsyncStorage.getItem(LIKED_KEY);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      liked.current = new Set(ids);
      run(`setLikedIds(${S(ids)})`);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1,
          timeInterval: 1000,
        },
        (loc) => {
          locRef.current = loc;
          run(`updateLocation(${loc.coords.latitude},${loc.coords.longitude})`);
        },
      );
    })();
  }, []);

  const loadMarkers = async () => {
    try {
      await loadLiked();
      const { items } = await pb
        .collection('map_markers')
        .getList<MapMarkerRecord>(1, 500, {
          sort: '-created',
          expand: 'image',
        });
      items.forEach((r) => {
        const img = r.expand?.image;
        const url = img ? pb.files.getURL(img, img.image) : '';
        if (r.title) {
          run(
            `addTaskMarker(${r.lang},${r.long},${S(r.title)},${S(r.icon || 'location')},${S(r.color || '#3388ff')},${S(r.desc || '')},${S(url)},${S(r.id)},${r.likes ?? 0})`,
          );
        } else if (img) {
          run(
            `addPhotoToCluster(${r.lang},${r.long},${S(url)},${S(r.id)},${r.likes ?? 0})`,
          );
        }
      });
    } catch (e) {
      console.error('Markkereiden lataus epäonnistui:', e);
    }
  };

  const handleToggle = (markerId: string, isLike: boolean) => {
    const delta = isLike ? 1 : -1;
    if (isLike) liked.current.add(markerId);
    else liked.current.delete(markerId);
    saveLiked();
    pb.collection('map_markers')
      .getOne(markerId)
      .then((rec) => {
        const n = Math.max(0, ((rec.likes as number) ?? 0) + delta);
        return pb
          .collection('map_markers')
          .update(markerId, { likes: n })
          .then(() => n);
      })
      .then((n) => run(`updateLikes(${S(markerId)},${n},${isLike})`))
      .catch((e) => {
        if (isLike) liked.current.delete(markerId);
        else liked.current.add(markerId);
        saveLiked();
        console.error('Tykkäys epäonnistui:', e);
      });
  };

  const onMessage = (e: WebViewMessageEvent) => {
    const d = e.nativeEvent.data;
    if (d === 'ready') {
      ready.current = true;
      needsReload.current = false;
      run('clearMarkers()');
      loadMarkers();
    } else if (d === 'unlock') setTracking(false);
    else if (d.startsWith('like:')) handleToggle(d.slice(5), true);
    else if (d.startsWith('unlike:')) handleToggle(d.slice(7), false);
  };

  useFocusEffect(
    useCallback(() => {
      if (newMarkerParamRef.current) {
        // newMarker param present — useEffect will inject it directly, skip full reload
        return;
      }
      if (!ready.current) {
        needsReload.current = true;
        return;
      }
      run('clearMarkers()');
      loadMarkers();
    }, []),
  );

  useEffect(() => {
    const m = route.params?.newMarker;
    if (!m) return;
    navigation.setParams({ newMarker: undefined });
    if (ready.current) {
      run(`addPhotoToCluster(${m.la},${m.lo},${S(m.url)},${S(m.id)},0)`);
    }
  }, [route.params?.newMarker]);

  return (
    <View style={styles.mapContainer}>
      <WebView
        ref={webRef}
        source={{ html: LEAFLET_HTML, baseUrl: 'https://unpkg.com' }}
        style={styles.map}
        originWhitelist={['*']}
        mixedContentMode="always"
        onMessage={onMessage}
        onLoadStart={() => {
          ready.current = false;
        }}
      />
      <TouchableOpacity
        style={[styles.locateButton, tracking && styles.locateButtonActive]}
        onPress={() => {
          setTracking(true);
          run('centerOnUser()');
        }}
      >
        <Text style={styles.locateIcon}>📍</Text>
      </TouchableOpacity>
    </View>
  );
}
