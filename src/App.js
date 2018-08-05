import React, {	Component } from 'react';
import './App.css';
import { sightLocations } from './locations.js';
import { mapStyle } from './mapStyle.js';
import scriptLoader from 'react-async-script-loader';
import escapeRegExp from 'escape-string-regexp';
import sortBy from 'sort-by';
import fetchJsonp from 'fetch-jsonp';

let markers = [];
// name of variable https://stackoverflow.com/questions/4539905/close-all-infowindows-in-google-maps-api-v3
let infoWindows = [];

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			locations: sightLocations,
			map: {},
			query: '',
			requestWasSuccessful: true,
			selectedMarker: '',
			data: []
		};
	}

	/* The idea of this part of code was derived from here:
	https://stackoverflow.com/questions/51250518/using-this-setstate-with-update-from-immutability-helper-is-not-re-rendering-rea
	Initial version: 
	updateQuery = (query) => {
    this.setState({query: query.trim()})
    }
    The moment is that Jshint considers this an error, but - it works. Hmm.
	*/

	updateQuery = function updateQuery(query) {
		this.setState({
			query: query.trim()
		});
	}

	updateData = function updateData(newData) {
		this.setState({
			data: newData
		});
	}

	componentWillReceiveProps({
		isScriptLoadSucceed
	}) {
		if (isScriptLoadSucceed) {
			const map = new window.google.maps.Map(document.getElementById('map'), {
				zoom: 35,
				center: new window.google.maps.LatLng(55.751244, 37.618423),
				styles: mapStyle
			});
			this.setState({
				map: map
			});
		} else {
			console.log("Oops! Something went wrong. Google Map can't be displayed.");
			this.setState({
				requestWasSuccessful: false
			});
		}
	}

	componentDidUpdate() {
		//Locations filter
		const {
			locations,
			query,
			map
		} = this.state;
		let showingLocations = locations;
		if (query) {
			const match = new RegExp(escapeRegExp(query), 'i');
			showingLocations = locations.filter((location) => match.test(location.title));
		} else {
			showingLocations = locations;
		}
		markers.forEach(mark => {
			mark.setMap(null)
		});
		markers = [];
		infoWindows = [];
        
		showingLocations.map((marker, index) => {

			// The most common resource used for searching
			let getLink = this.state.data.filter(function(a) {
			  return marker.title === a[0][0];
			}).map(function(a) {
			  if (0 === a.length) {
			      return "https://www.wikipedia.org";
			        }
			          if ("" !== a[1]) {
			              return a[2];
			                }
			            });

			let contentList =
				`<div class="infoWindow">
    <h3>${marker.title}</h3>
    <span>${marker.description}</span>
    <p><a href=${getLink}>Wiki Link</a></p>
    </div>`;
			//Add descriptions to markers
			let addInfoWindow = new window.google.maps.InfoWindow({
				content: contentList
			});

			let bounds = new window.google.maps.LatLngBounds();
			//Creating the markers for the map
			let addmarkers = new window.google.maps.Marker({
				map: map,
				position: marker.location,
				animation: window.google.maps.Animation.DROP,
				name: marker.title
			});
			//Add markers and animation for the selected markers
markers.push(addmarkers);
infoWindows.push(addInfoWindow);

addmarkers.addListener("click", function() {
  infoWindows.forEach(function(info) {
    info.close();
  });
  addInfoWindow.open(map, addmarkers);
  //Clear he animaiton before add the new one
  if (addmarkers.getAnimation() !== null) {
    addmarkers.setAnimation(null);
  } else {
    addmarkers.setAnimation(window.google.maps.Animation.BOUNCE);
    setTimeout(function() {
      addmarkers.setAnimation(null);
    }, 200);
  }
});
            
			markers.forEach((m) => bounds.extend(m.position));
			map.fitBounds(bounds);
		});
	}

	/*Helpful link:
	https://stackoverflow.com/questions/43454125/how-to-return-the-json-response-from-the-fetch-api
	*/

	componentDidMount() {
		this.state.locations.map((location, index) => {
			return fetchJsonp(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${location.title}&format=json&callback=wikiCallback`)
				.then(response => response.json()).then((responseJson) => {
					let newData = [...this.state.data, [responseJson, responseJson[2][0], responseJson[3][0]]];
					this.updateData(newData);
				}).catch(error =>
					console.error(error)
				);
		});
	}


listItem = function(item, event) {
  let selected = markers.filter(function(currentOne) {
    return currentOne.name === item.title;
  });
  window.google.maps.event.trigger(selected[0], "click");
};

	handleKeyPress(target, item, e) {
		if (item.charCode === 10) {
			this.listItem(target, e);
		}
	}

	render() {
			const {
				locations,
				query,
				requestWasSuccessful
			} = this.state;
			//the filter
			let showingLocations = void 0;
if (query) {
  var match = new RegExp(escapeRegExp(query), "i");
  showingLocations = locations.filter(function(location) {
    return match.test(location.title);
  });
} else {
  showingLocations = locations;
}

			showingLocations.sort(sortBy('title'));
			return (
				requestWasSuccessful ? ( 
                    <div>
					<nav className = "nav_bar">
                    <span id = "subject">Sights of Moscow</span></nav>
					<div id = "container">
					<div id = "map-container">
                    <div id = "map"></div>
                    </div>
                    
					<div className = 'listSights'>
					<input id = "placeToSearch"	className = 'search_box' type = 'text' placeholder = 'Start typing the name of the object'
					value = {query} onChange = {(event) => this.updateQuery(event.target.value)}/>
                    <ul> 
                    {showingLocations.map((getLocation, index) => 
                    <li key = {index}
							onKeyPress = {this.handleKeyPress.bind(this, getLocation)}
							onClick = {this.listItem.bind(this, getLocation)} > {getLocation.title} 
                    </li>)}
                    </ul>
							</div>            <
							/div>    <
							/div>    ) : ( <div></div > )
					)
				}

				// end  

			}

			//Usage from https://stackoverflow.com/questions/43351122/building-a-component-which-depends-on-a-3rd-party-script
			
			export default scriptLoader(
				[`https://maps.googleapis.com/maps/api/js?libraries=places,geometry,drawing&key=AIzaSyBi8W9MCTVS_B4_DS-Y2Cr8aFfbWeqSAP8&v=3&callback=initMap`]
			)(App);

			