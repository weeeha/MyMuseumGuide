import {
  IonAccordion,
  IonAccordionGroup,
  IonAvatar,
  IonBadge,
  IonBreadcrumb,
  IonBreadcrumbs,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCheckbox,
  IonChip,
  IonDatetime,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInput,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonProgressBar,
  IonRadio,
  IonRadioGroup,
  IonRange,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonSpinner,
  IonTextarea,
  IonThumbnail,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/react';
import {
  add,
  star,
  heart,
  closeCircle,
  close,
  person,
  mail,
  home,
  settings,
  sunny,
  moon,
  volumeLow,
  volumeHigh,
  chatbubble,
  notifications,
  camera,
  trash,
  share,
} from 'ionicons/icons';
import './Components.css';

const ComponentColumn: React.FC<{ mode: 'light' | 'dark' }> = ({ mode }) => {
  const isDark = mode === 'dark';

  return (
    <div className={`component-column ${isDark ? 'ion-palette-dark' : ''}`}>
      <div className="column-inner">
        <h1 className="column-title">{isDark ? 'Dark Mode' : 'Light Mode'}</h1>

        {/* Buttons */}
        <section className="component-section">
          <h2 className="section-title">Buttons</h2>
          <div className="component-row">
            <IonButton>Default</IonButton>
            <IonButton color="secondary">Secondary</IonButton>
            <IonButton color="tertiary">Tertiary</IonButton>
          </div>
          <div className="component-row">
            <IonButton color="success">Success</IonButton>
            <IonButton color="warning">Warning</IonButton>
            <IonButton color="danger">Danger</IonButton>
          </div>
          <div className="component-row">
            <IonButton fill="outline">Outline</IonButton>
            <IonButton fill="clear">Clear</IonButton>
            <IonButton disabled>Disabled</IonButton>
          </div>
          <div className="component-row">
            <IonButton size="small">Small</IonButton>
            <IonButton size="default">Default</IonButton>
            <IonButton size="large">Large</IonButton>
          </div>
          <div className="component-row">
            <IonButton shape="round">Round</IonButton>
            <IonButton shape="round" fill="outline">Round Outline</IonButton>
          </div>
          <div className="component-row">
            <IonButton>
              <IonIcon slot="start" icon={star} />
              With Icon
            </IonButton>
            <IonButton>
              Trailing
              <IonIcon slot="end" icon={share} />
            </IonButton>
            <IonButton>
              <IonIcon slot="icon-only" icon={heart} />
            </IonButton>
          </div>
          <div className="component-row">
            <IonButton expand="block">Block Button</IonButton>
          </div>
        </section>

        {/* Card */}
        <section className="component-section">
          <h2 className="section-title">Card</h2>
          <IonCard>
            <img alt="Card media" src="https://ionicframework.com/docs/img/demos/card-media.png" />
            <IonCardHeader>
              <IonCardTitle>Card Title</IonCardTitle>
              <IonCardSubtitle>Card Subtitle</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              Here's a small text description for the card content area.
            </IonCardContent>
          </IonCard>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>List Card</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="none">
                <IonItem>
                  <IonIcon icon={notifications} slot="start" color="primary" />
                  <IonLabel>Notifications</IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={chatbubble} slot="start" color="secondary" />
                  <IonLabel>Messages</IonLabel>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>
        </section>

        {/* Inputs */}
        <section className="component-section">
          <h2 className="section-title">Inputs</h2>
          <IonList>
            <IonItem>
              <IonInput label="Text Input" labelPlacement="stacked" placeholder="Enter text" />
            </IonItem>
            <IonItem>
              <IonInput label="Floating Label" labelPlacement="floating" placeholder="Type here" />
            </IonItem>
            <IonItem>
              <IonInput label="Email" labelPlacement="stacked" type="email" placeholder="email@example.com" />
            </IonItem>
            <IonItem>
              <IonInput label="Password" labelPlacement="stacked" type="password" value="password123" />
            </IonItem>
            <IonItem>
              <IonInput label="Disabled" labelPlacement="stacked" disabled value="Cannot edit" />
            </IonItem>
          </IonList>
          <div style={{ marginTop: 12 }}>
            <IonInput
              fill="outline"
              label="Outline Fill"
              labelPlacement="floating"
              placeholder="Outside ion-item"
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <IonInput
              fill="solid"
              label="Solid Fill"
              labelPlacement="floating"
              placeholder="Outside ion-item"
            />
          </div>
        </section>

        {/* Textarea */}
        <section className="component-section">
          <h2 className="section-title">Textarea</h2>
          <IonList>
            <IonItem>
              <IonTextarea label="Message" labelPlacement="stacked" placeholder="Type your message..." rows={3} />
            </IonItem>
          </IonList>
          <div style={{ marginTop: 12 }}>
            <IonTextarea
              fill="outline"
              label="Outline Textarea"
              labelPlacement="floating"
              placeholder="Outlined"
              rows={2}
            />
          </div>
        </section>

        {/* Searchbar */}
        <section className="component-section">
          <h2 className="section-title">Searchbar</h2>
          <IonSearchbar placeholder="Search..." />
          <IonSearchbar showCancelButton="always" placeholder="With cancel" />
        </section>

        {/* Select */}
        <section className="component-section">
          <h2 className="section-title">Select</h2>
          <IonList>
            <IonItem>
              <IonSelect label="Fruit" labelPlacement="stacked" placeholder="Choose one">
                <IonSelectOption value="apple">Apple</IonSelectOption>
                <IonSelectOption value="banana">Banana</IonSelectOption>
                <IonSelectOption value="cherry">Cherry</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonSelect label="Floating" labelPlacement="floating" placeholder="Select fruit">
                <IonSelectOption value="apple">Apple</IonSelectOption>
                <IonSelectOption value="banana">Banana</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonList>
        </section>

        {/* Toggle */}
        <section className="component-section">
          <h2 className="section-title">Toggle</h2>
          <IonList>
            <IonItem>
              <IonToggle>Wi-Fi</IonToggle>
            </IonItem>
            <IonItem>
              <IonToggle checked>Bluetooth</IonToggle>
            </IonItem>
            <IonItem>
              <IonToggle checked color="success">Notifications</IonToggle>
            </IonItem>
            <IonItem>
              <IonToggle disabled>Disabled</IonToggle>
            </IonItem>
            <IonItem>
              <IonToggle enableOnOffLabels checked>On/Off Labels</IonToggle>
            </IonItem>
          </IonList>
        </section>

        {/* Checkbox */}
        <section className="component-section">
          <h2 className="section-title">Checkbox</h2>
          <IonList>
            <IonItem>
              <IonCheckbox>Unchecked</IonCheckbox>
            </IonItem>
            <IonItem>
              <IonCheckbox checked>Checked</IonCheckbox>
            </IonItem>
            <IonItem>
              <IonCheckbox indeterminate>Indeterminate</IonCheckbox>
            </IonItem>
            <IonItem>
              <IonCheckbox disabled>Disabled</IonCheckbox>
            </IonItem>
          </IonList>
        </section>

        {/* Radio */}
        <section className="component-section">
          <h2 className="section-title">Radio</h2>
          <IonList>
            <IonRadioGroup value="option1">
              <IonItem>
                <IonRadio value="option1">Option 1</IonRadio>
              </IonItem>
              <IonItem>
                <IonRadio value="option2">Option 2</IonRadio>
              </IonItem>
              <IonItem>
                <IonRadio value="option3" disabled>Option 3 (Disabled)</IonRadio>
              </IonItem>
            </IonRadioGroup>
          </IonList>
        </section>

        {/* Range */}
        <section className="component-section">
          <h2 className="section-title">Range</h2>
          <IonList>
            <IonItem>
              <IonRange label="Brightness" labelPlacement="stacked">
                <IonIcon slot="start" icon={sunny} />
                <IonIcon slot="end" icon={sunny} size="large" />
              </IonRange>
            </IonItem>
            <IonItem>
              <IonRange label="Volume" labelPlacement="stacked" pin pinFormatter={(value: number) => `${value}%`}>
                <IonIcon slot="start" icon={volumeLow} />
                <IonIcon slot="end" icon={volumeHigh} />
              </IonRange>
            </IonItem>
            <IonItem>
              <IonRange label="Dual Knobs" labelPlacement="stacked" dualKnobs pin value={{ lower: 20, upper: 80 }} />
            </IonItem>
            <IonItem>
              <IonRange label="With Snaps" labelPlacement="stacked" min={0} max={100} step={25} snaps ticks />
            </IonItem>
          </IonList>
        </section>

        {/* Segment */}
        <section className="component-section">
          <h2 className="section-title">Segment</h2>
          <IonSegment value="all">
            <IonSegmentButton value="all">
              <IonLabel>All</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="favorites">
              <IonLabel>Favorites</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="shared">
              <IonLabel>Shared</IonLabel>
            </IonSegmentButton>
          </IonSegment>
          <div style={{ marginTop: 12 }}>
            <IonSegment value="calls">
              <IonSegmentButton value="calls">
                <IonIcon icon={chatbubble} />
                <IonLabel>Chats</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="favorites">
                <IonIcon icon={heart} />
                <IonLabel>Favorites</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="contacts">
                <IonIcon icon={person} />
                <IonLabel>Contacts</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>
        </section>

        {/* Chips */}
        <section className="component-section">
          <h2 className="section-title">Chips</h2>
          <div className="component-row">
            <IonChip>
              <IonLabel>Default</IonLabel>
            </IonChip>
            <IonChip color="primary">
              <IonLabel>Primary</IonLabel>
            </IonChip>
            <IonChip color="secondary">
              <IonLabel>Secondary</IonLabel>
            </IonChip>
          </div>
          <div className="component-row">
            <IonChip color="success">
              <IonLabel>Success</IonLabel>
            </IonChip>
            <IonChip color="warning">
              <IonLabel>Warning</IonLabel>
            </IonChip>
            <IonChip color="danger">
              <IonLabel>Danger</IonLabel>
            </IonChip>
          </div>
          <div className="component-row">
            <IonChip>
              <IonIcon icon={close} color="primary" />
              <IonLabel>Closable</IonLabel>
              <IonIcon icon={closeCircle} />
            </IonChip>
            <IonChip>
              <IonAvatar>
                <img alt="avatar" src="https://ionicframework.com/docs/img/demos/avatar.svg" />
              </IonAvatar>
              <IonLabel>Avatar Chip</IonLabel>
            </IonChip>
          </div>
          <div className="component-row">
            <IonChip outline>
              <IonLabel>Outline</IonLabel>
            </IonChip>
            <IonChip outline color="primary">
              <IonLabel>Primary Outline</IonLabel>
            </IonChip>
          </div>
        </section>

        {/* Badges */}
        <section className="component-section">
          <h2 className="section-title">Badges</h2>
          <IonList>
            <IonItem>
              <IonIcon icon={chatbubble} slot="start" />
              <IonLabel>Messages</IonLabel>
              <IonBadge slot="end">5</IonBadge>
            </IonItem>
            <IonItem>
              <IonIcon icon={notifications} slot="start" />
              <IonLabel>Notifications</IonLabel>
              <IonBadge slot="end" color="danger">99+</IonBadge>
            </IonItem>
            <IonItem>
              <IonIcon icon={mail} slot="start" />
              <IonLabel>Inbox</IonLabel>
              <IonBadge slot="end" color="success">New</IonBadge>
            </IonItem>
            <IonItem>
              <IonIcon icon={person} slot="start" />
              <IonLabel>Followers</IonLabel>
              <IonBadge slot="end" color="warning">12</IonBadge>
            </IonItem>
          </IonList>
          <div className="component-row" style={{ marginTop: 12 }}>
            <IonBadge>Default</IonBadge>
            <IonBadge color="secondary">Secondary</IonBadge>
            <IonBadge color="tertiary">Tertiary</IonBadge>
            <IonBadge color="success">Success</IonBadge>
            <IonBadge color="warning">Warning</IonBadge>
            <IonBadge color="danger">Danger</IonBadge>
          </div>
        </section>

        {/* Spinners */}
        <section className="component-section">
          <h2 className="section-title">Spinners</h2>
          <div className="component-row">
            <IonSpinner name="circular" />
            <IonSpinner name="dots" />
            <IonSpinner name="bubbles" />
            <IonSpinner name="circles" />
            <IonSpinner name="crescent" />
            <IonSpinner name="lines" />
          </div>
        </section>

        {/* Progress Bar */}
        <section className="component-section">
          <h2 className="section-title">Progress Bar</h2>
          <IonProgressBar value={0.25} />
          <div style={{ height: 12 }} />
          <IonProgressBar value={0.5} color="secondary" />
          <div style={{ height: 12 }} />
          <IonProgressBar value={0.75} color="success" />
          <div style={{ height: 12 }} />
          <IonProgressBar type="indeterminate" color="tertiary" />
          <div style={{ height: 12 }} />
          <IonProgressBar buffer={0.6} value={0.3} />
        </section>

        {/* Skeleton Text */}
        <section className="component-section">
          <h2 className="section-title">Skeleton Text</h2>
          <IonList>
            <IonItem>
              <IonThumbnail slot="start">
                <IonSkeletonText animated style={{ width: '100%', height: '100%' }} />
              </IonThumbnail>
              <IonLabel>
                <h3><IonSkeletonText animated style={{ width: '60%' }} /></h3>
                <p><IonSkeletonText animated style={{ width: '40%' }} /></p>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonThumbnail slot="start">
                <IonSkeletonText animated style={{ width: '100%', height: '100%' }} />
              </IonThumbnail>
              <IonLabel>
                <h3><IonSkeletonText animated style={{ width: '70%' }} /></h3>
                <p><IonSkeletonText animated style={{ width: '50%' }} /></p>
              </IonLabel>
            </IonItem>
          </IonList>
        </section>

        {/* List */}
        <section className="component-section">
          <h2 className="section-title">List</h2>
          <IonList inset>
            <IonListHeader>
              <IonLabel>Contacts</IonLabel>
            </IonListHeader>
            <IonItem>
              <IonAvatar slot="start">
                <img alt="avatar" src="https://ionicframework.com/docs/img/demos/avatar.svg" />
              </IonAvatar>
              <IonLabel>
                <h2>Alice Johnson</h2>
                <p>Software Engineer</p>
              </IonLabel>
              <IonNote slot="end">3 min ago</IonNote>
            </IonItem>
            <IonItem>
              <IonAvatar slot="start">
                <img alt="avatar" src="https://ionicframework.com/docs/img/demos/avatar.svg" />
              </IonAvatar>
              <IonLabel>
                <h2>Bob Smith</h2>
                <p>Product Designer</p>
              </IonLabel>
              <IonNote slot="end">1 hr ago</IonNote>
            </IonItem>
            <IonItem>
              <IonAvatar slot="start">
                <img alt="avatar" src="https://ionicframework.com/docs/img/demos/avatar.svg" />
              </IonAvatar>
              <IonLabel>
                <h2>Carol Williams</h2>
                <p>Project Manager</p>
              </IonLabel>
              <IonNote slot="end">Yesterday</IonNote>
            </IonItem>
          </IonList>
          <IonList inset>
            <IonItem>
              <IonIcon icon={camera} slot="start" />
              <IonLabel>Photos</IonLabel>
              <IonNote slot="end">256</IonNote>
            </IonItem>
            <IonItem>
              <IonIcon icon={trash} slot="start" color="danger" />
              <IonLabel color="danger">Delete All</IonLabel>
            </IonItem>
          </IonList>
        </section>

        {/* Item Group / Divider */}
        <section className="component-section">
          <h2 className="section-title">Item Group & Divider</h2>
          <IonList>
            <IonItemGroup>
              <IonItemDivider>
                <IonLabel>Section A</IonLabel>
              </IonItemDivider>
              <IonItem>
                <IonIcon icon={home} slot="start" />
                <IonLabel>Home</IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={settings} slot="start" />
                <IonLabel>Settings</IonLabel>
              </IonItem>
            </IonItemGroup>
            <IonItemGroup>
              <IonItemDivider>
                <IonLabel>Section B</IonLabel>
              </IonItemDivider>
              <IonItem>
                <IonIcon icon={person} slot="start" />
                <IonLabel>Profile</IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={mail} slot="start" />
                <IonLabel>Messages</IonLabel>
              </IonItem>
            </IonItemGroup>
          </IonList>
        </section>

        {/* Accordion */}
        <section className="component-section">
          <h2 className="section-title">Accordion</h2>
          <IonAccordionGroup>
            <IonAccordion value="first">
              <IonItem slot="header" color="light">
                <IonLabel>First Accordion</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                Content for the first accordion item. This can contain any elements.
              </div>
            </IonAccordion>
            <IonAccordion value="second">
              <IonItem slot="header" color="light">
                <IonLabel>Second Accordion</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                Content for the second accordion item with more details.
              </div>
            </IonAccordion>
            <IonAccordion value="third">
              <IonItem slot="header" color="light">
                <IonLabel>Third Accordion</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                Content for the third accordion item.
              </div>
            </IonAccordion>
          </IonAccordionGroup>
        </section>

        {/* Breadcrumbs */}
        <section className="component-section">
          <h2 className="section-title">Breadcrumbs</h2>
          <IonBreadcrumbs>
            <IonBreadcrumb href="#">Home</IonBreadcrumb>
            <IonBreadcrumb href="#">Settings</IonBreadcrumb>
            <IonBreadcrumb href="#">Privacy</IonBreadcrumb>
            <IonBreadcrumb active>Notifications</IonBreadcrumb>
          </IonBreadcrumbs>
        </section>

        {/* Toolbar */}
        <section className="component-section">
          <h2 className="section-title">Toolbar</h2>
          <IonToolbar>
            <IonButton slot="start" fill="clear">
              <IonIcon slot="icon-only" icon={person} />
            </IonButton>
            <IonTitle>Page Title</IonTitle>
            <IonButton slot="end" fill="clear">
              <IonIcon slot="icon-only" icon={settings} />
            </IonButton>
          </IonToolbar>
          <IonToolbar color="primary">
            <IonTitle>Primary Toolbar</IonTitle>
          </IonToolbar>
        </section>

        {/* FAB */}
        <section className="component-section">
          <h2 className="section-title">FAB</h2>
          <div className="fab-row">
            <IonFabButton size="small" color="tertiary">
              <IonIcon icon={star} />
            </IonFabButton>
            <IonFabButton size="small" color="secondary">
              <IonIcon icon={heart} />
            </IonFabButton>
            <IonFabButton>
              <IonIcon icon={add} />
            </IonFabButton>
          </div>
        </section>

        {/* Datetime */}
        <section className="component-section">
          <h2 className="section-title">Datetime</h2>
          <IonDatetime presentation="date" preferWheel={false} />
        </section>

      </div>
    </div>
  );
};

const Components: React.FC = () => {
  return (
    <div className="components-page">
      <ComponentColumn mode="light" />
      <ComponentColumn mode="dark" />
    </div>
  );
};

export default Components;
