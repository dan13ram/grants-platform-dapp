import { Injectable } from '@angular/core';
import * as IPFS from 'ipfs';
import * as OrbitDB from 'orbit-db';
// import * as Identities from 'orbit-db-identity-provider';

export interface IGrant {
  _id: string;
  name: string;
  description: string;
  images: Array<string>;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrbitService {
  ipfsOptions = {
    EXPERIMENTAL: {
      pubsub: true
    },
  }

  accessOptions = {
    // Give write access to everyone
    accessController: {
      write: ['*']
    }
  }

  grantDbAddress = "orbitdb/zdpuAwDkuDG1Yekf35M4EFBGzg6VPjq6UQNyMWD5n5Whr4KKW/grant";
  ipfs: any;
  orbitdb: any;
  db: any;
  dbReady = false;

  grants = [];

  constructor() {
    // console.log("IPFS", IPFS);
    // console.log("orbitDB", OrbitDB);

    // Create IPFS instance
    this.ipfs = new IPFS({
      //repo: '/orbitdb/examples/browser/new/ipfs/0.27.3',
      repo: 'ipfs-1',
      start: true,
      EXPERIMENTAL: {
        pubsub: true
      },
      config: {
        Addresses: {
          Swarm: [
            // Use IPFS dev signal server
            // '/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star',
            // '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
            // Use local signal server
            // '/ip4/0.0.0.0/tcp/9090/wss/p2p-webrtc-star',
            // "/ip4/107.170.133.32/tcp/4001/ipfs/QmUZRGLhcKXF1JyuaHgKm23LvqcoMYwtb9jmh8CkP4og3K",
            // "/ip4/139.59.174.197/tcp/4001/ipfs/QmZfTbnpvPwxCjpCG3CXJ7pfexgkBZ2kgChAiRJrTK1HsM",
            // "/ip4/139.59.6.222/tcp/4001/ipfs/QmRDcEDK9gSViAevCHiE6ghkaBCU7rTuQj4BDpmCzRvRYg",
            // "/ip4/46.101.198.170/tcp/4001/ipfs/QmePWxsFT9wY3QuukgVDB7XZpqdKhrqJTHTXU7ECLDWJqX",
            // "/ip4/198.46.197.197/tcp/4001/ipfs/QmdXiwDtfKsfnZ6RwEcovoWsdpyEybmmRpVDXmpm5cpk2s",
            // "/ip4/198.46.197.197/tcp/4002/ipfs/QmWAm7ZPLGTgofLXZgoAzEaNkYFPsaVKKGjWscE4Fbec9P"
          ]
        },

        //Bootstrap: [
        //  "/ip4/198.46.197.197/tcp/4001/ipfs/QmdXiwDtfKsfnZ6RwEcovoWsdpyEybmmRpVDXmpm5cpk2s",
        //  "/ip4/198.46.197.197/tcp/4002/ipfs/QmWAm7ZPLGTgofLXZgoAzEaNkYFPsaVKKGjWscE4Fbec9P"
        //]
      }
    })

    this.ipfs.on('error', (e) => this.handleError(e))

    this.ipfs.on('ready', async () => {
      console.log('IPFS is ready');

      console.log(`Connecting to DB ${this.grantDbAddress} waiting...`);
      this.orbitdb = await OrbitDB.createInstance(this.ipfs);

      // this.db = await this.orbitdb.open(this.grantDbAddress, {
      //   // If database doesn't exist, create it
      //   create: true,
      //   overwrite: false,
      //   // Load only the local version of the database,
      //   // don't load the latest from the network yet
      //   localOnly: false,
      //   type: 'docstore',
      //   write: ['*'],
      // });


      this.db = await this.orbitdb.docs(this.grantDbAddress, {
        accessController: {
          write: ['*']
        }
      })


      this.db.events.on('ready', () => {
        console.log(`Database is ready!`)
      })

      // Load the latest local copy of the DB.
      await this.db.load();

      // Signal that the DB is ready for use.
      this.dbReady = true;

      this.db.events.on('replicated', (address) => {
        console.log(`DB just replicated with peer ${address}.`);

        let temp = this.db.get('');
        console.log("temp", temp);
      })
      //  Get grants
    });
  }

  handleError(e) {
    console.error(`Error with IPFS: `, e.stack)
  }

  async addGrant(data) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.db.put(data);
        console.log(`Grant added to DB!`);
        resolve(data);
      } catch (e) {
        reject();
      }
    })
  }

  async getGrants() {
    return new Promise((resolve) => {
      let cheker = null;

      cheker = setInterval(() => {
        if (this.dbReady) {
          getData();
          clearInterval(cheker);
        }
      }, 500);

      const getData = () => {
        let grants = this.db.get('');
        console.log("OrbitData", grants)
        resolve(grants || [])
      };
    })
  }

  getGrantsById(id: string) {
    return new Promise((resolve) => {
      let cheker = null;

      cheker = setInterval(() => {
        console.log("this.dbReady", this.dbReady);

        if (this.dbReady) {
          getData();
          clearInterval(cheker);
        }
      }, 500);

      const getData = () => {
        let grants = this.db.get(id);
        if (grants) {
          resolve(grants[0])
        } else {
          resolve({
            _id: '',
            name: '',
            description: '',
            images: 'https://firebasestorage.googleapis.com/v0/b/grants-platform.appspot.com/o/grant-content%2F1590246149579_roadie_3_tuner-ccbc4c5.jpg?alt=media',
            content: ''
          })
        }
      };

    })
  }

}
