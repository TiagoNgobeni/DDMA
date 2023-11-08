// This loads helper components from the Extended Component Library,
// https://github.com/googlemaps/extended-component-library.
// Please note unpkg.com is unaffiliated with Google Maps Platform.
import {APILoader} from 'https://unpkg.com/@googlemaps/extended-component-library@0.4';

class LocatorPlus {
  static REQUIRED_MAPS_JS_LIBRARIES = ['core', 'marker'];

  constructor(configuration) {
    this.locations = configuration.locations || [];
    this.capabilities = configuration.capabilities || {};
    this.mapOptions = configuration.mapOptions || {};
  }

  /** Returns a fully initialized Locator widget. */
  static async init(configuration) {
    const locator = new LocatorPlus(configuration);

    await locator.loadMapsLibraries();
    locator.initializeDOMReferences();
    locator.initializeMapLocations();

    // Initial render of results
    locator.renderResultsList();

    return locator;
  }

  /** Loads resources from the Google Maps JS SDK. */
  async loadMapsLibraries() {
    this.mapsLibraries = {};
    return Promise.all(
        LocatorPlus.REQUIRED_MAPS_JS_LIBRARIES.map(async (libName) => {
          this.mapsLibraries[libName] = await APILoader.importLibrary(libName);
        }));
  }

  /** Caches references to required DOM elements. */
  initializeDOMReferences() {
    this.mapEl = document.querySelector('gmp-map');
    this.panelEl = document.getElementById('locations-panel');
    this.resultItemTemplate =
        document.getElementById('locator-result-item-template');
    this.resultsContainerEl = document.getElementById('location-results-list');
  }

  /** Sets one of the locations as "selected". */
  selectResultItem(locationIdx, panToMarker, scrollToResult) {
    this.selectedLocationIdx = locationIdx;
    for (const li of this.resultsContainerEl.children) {
      li.classList.remove('selected');
      if (parseInt(li.dataset.locationIndex) === this.selectedLocationIdx) {
        li.classList.add('selected');
        if (scrollToResult) {
          li.scrollIntoView({behavior: 'smooth', block: 'nearest'});
        }
      }
    }
    if (panToMarker && (locationIdx != null)) {
      this.map.panTo(this.locations[locationIdx].coords);
    }
  }

  /** Updates the map bounds to markers. */
  updateBounds() {
    const bounds = new this.mapsLibraries.core.LatLngBounds();
    for (let i = 0; i < this.markers.length; i++) {
      bounds.extend(this.markers[i].getPosition());
    }
    this.map.fitBounds(bounds);
  }

  /** Initializes the map and markers. */
  initializeMapLocations() {
    this.selectedLocationIdx = null;

    // Initialize the map.
    this.map = this.mapEl.innerMap;
    this.map.setOptions({
      ...this.mapOptions,
      mapId: this.mapOptions.mapId || 'DEMO_MAP_ID'
    });

    // Create a marker for each location.
    this.markers = this.locations.map((location, index) => {
      const marker = new this.mapsLibraries.marker.Marker({
        position: location.coords,
        map: this.map,
        title: location.title,
      });
      marker.addListener('click', () => {
        this.selectResultItem(index, false, true);
      });
      return marker;
    });

    // Fit map to marker bounds after initialization.
    if (this.locations.length) {
      this.updateBounds();
    }

    // Create a PlaceResult stub for each location.
    const LatLng = this.mapsLibraries.core.LatLng;
    for (const location of this.locations) {
      location.placeResult = {
        place_id: location.placeId,
        name: location.title,
        formatted_address: location.address1 + ' ' + location.address2,
        geometry: { location: new LatLng(location.coords) }
      };
    }
  }

  /**
   * Creates a DOM Element corresponding to an individual result item.
   */
  createResultItem(location) {
    // Create the parent DOM node.
    const li =
        this.resultItemTemplate.content.firstElementChild.cloneNode(true);
    li.dataset.locationIndex = location.index;
    if (location.index === this.selectedLocationIdx) {
      li.classList.add('selected');
    }

    li.querySelector('gmpx-place-data-provider').place = location.placeResult;
    li.querySelector('.address')
        .append(
            location.address1, document.createElement('br'), location.address2);
    li.querySelector('gmpx-place-directions-button').origin =
        this.searchLocation ? this.searchLocation.location : null;
    const actionsContainer = li.querySelector('.actions');
    for (const action of location.actions ?? []) {
      if (action.defaultUrl) {
        const actionButton = document.createElement('gmpx-icon-button');
        actionButton.icon = 'open_in_new';
        actionButton.href = action.defaultUrl;
        actionButton.textContent = action.label;
        actionsContainer.append(actionButton);
      }
    }

    const resultSelectionHandler = () => {
      if (location.index !== this.selectedLocationIdx) {
        this.selectResultItem(location.index, true, false);
      }
    };

    // Clicking anywhere on the item selects this location.
    // Additionally, create a button element to make this behavior
    // accessible under tab navigation.
    li.addEventListener('click', resultSelectionHandler);
    li.querySelector('.select-location').addEventListener('click', (e) => {
      resultSelectionHandler();
      e.stopPropagation();
    });

    return li;
  }

  /** Renders the list of items next to the map. */
  renderResultsList() {
    let locations = this.locations.slice();
    for (let i = 0; i < locations.length; i++) {
      locations[i].index = i;
    }

    this.resultsContainerEl.replaceChildren(
        ...locations.map((x) => this.createResultItem(x)));
  }
}

document.addEventListener('DOMContentLoaded', () => LocatorPlus.init(CONFIGURATION));