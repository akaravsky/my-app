const graphql = require('graphql');
const {companies, users, likes} = require('../db');
//const fetch = require("node-fetch");


interface IUser {
    id: number;
    firstName: string;
    age: number;
    companyId?: keyof typeof companies.byId;
}

interface IUsersById {
    [key: number]: IUser
}

interface IUsers {
    byId: IUsersById,
    allIds: Array<number>
}

interface ICompany {
    id: number
    name: string;
    description: string;
}

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull,
    GraphQLScalarType
} = graphql;

const CompanyType = new GraphQLObjectType({
    name: 'Company',
    fields: () => ({
        id: { type: GraphQLInt },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        users: {
            type: new GraphQLList(UserType),
            resolve(parentValue: ICompany, args: any) {
                return users.allIds.reduce((acc: Array<IUser>, userId: keyof typeof users.byId) => {
                    const user = users.byId[userId] as IUser
                    if (user.companyId === parentValue.id) {
                        acc.push(user);
                    }
                    return acc
                }, [])
            }
        }
    })
});

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: GraphQLInt },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        email: { type: GraphQLString },
        company: {
            type: CompanyType,
            resolve(parentValue: IUser, args: any) {
                return companies.byId[parentValue.companyId]
            }
        }
    }
});

const UsersListType = new GraphQLList(UserType)

const LikesType = new GraphQLObjectType({
    name: 'Likes1',
    fields: {
        id: { type: GraphQLInt },
        myLikes: { type: GraphQLInt }
    }
})

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserType,
            args: { id: { type: GraphQLInt } },
            resolve(parentValue: any, args: { id: keyof typeof users.byId }) {
                //return users.find(user => user.id === args.id)
                return users.byId[args.id]
            }
        },
        company: {
            type: CompanyType,
            args: { id: { type: GraphQLInt } },
            resolve(parentValue: any, args: { id: keyof typeof companies.byId }) {
                //return users.find(user => user.id === args.id)
                return companies.byId[args.id]
            }
        },
        usersList: {
            type: UsersListType,
            args: {},
            resolve(parentValue: any, args: any) {
                return users.allIds.map((userId:number) => users.byId[userId]);
            }
        },
        likes: {
            type: LikesType,
            args: {},
            resolve(parentValue: any, args: any) {
                return likes
            }
        }
    }
})

const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: {
            type: UserType, //type that we return in resolve function
            args: {
                firstName: { type: new GraphQLNonNull(GraphQLString) },
                age: { type: GraphQLInt },
                companyId: { type: GraphQLString }
            },
            resolve(parentValue: any, { firstName, age }: { firstName: string, age: number }) {
                const id = Math.floor(Math.random() * 1000000)
                const newUser = { id, firstName, age }
                users.byId[id] = newUser;
                users.allIds.push(id);
                return newUser
            }
        },
        deleteUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLInt) }
            },
            resolve(parentValue: any, { id }: { id: number }) {
                delete users.byId[id];
                const index = users.allIds.indexOf(id);
                if (index > -1) {
                    users.allIds.splice(index, 1);
                }
                return users.byId[id]
            }
        },
        addLikes: {
            type: LikesType,
            args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
            resolve: async (parentValue: any, args: any) => {
                await sleep(2000);
                likes.myLikes = likes.myLikes + 1
                return likes
            }
        },
        signup: {
            type: UserType,
            args: {
                email: { type: GraphQLString },
                password: { type: GraphQLString }
            },
            resolve(parentValue:any, args:any, request:any){

            }
        }
    }
})

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation
});

/*
query 1
{
  company(id: 1) {
  	name,
  	description
	}
}

query 2
{
   user(id: 23) {
  	firstName,
      age,
      company: {
          name,
          description
      }
	}
}

query 3
{
    company(id: 2) {
        id,
        name,
        description,
        users {
            id,
            firstName,
            age,
            company{
                name
            }
        }
    }
}

query 4
{
    apple: company(id: 1){
        ...companyDetails
    }
    google: company(id: 2){
        ...companyDetails
    }
}
fragment companyDetails on Company {
    id
    name
    description
}

query 5
{
    usersList{
        firstName
    }
}

mutation 1
mutation {
    addUser(firstName: "Bill", age: 40) {
        id,
        firstName,
        age
    }
}
*/